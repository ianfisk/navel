import { CancellationToken } from 'poli-c';
import { fromEvent, Subject } from 'rxjs';
import { map, takeUntil, filter } from 'rxjs/operators';
import {
	CommandKind,
	Command,
	BackgroundScriptCommandKind,
	OpenInNewTabBackgroundScriptCommand,
} from '../../types';
import { DeferredPromise } from '../../util/deferred-promise';
import { logger } from '../../util/logger';
import { isBooleanAttributeSet, isHiddenOrDisabled, isAnchorElement } from '../../util/dom-utils';

interface ClickableElementEntry {
	element: Element;
	boundingRect: ClientRect;
}

interface Annotation {
	label: string;
	annotationElement: Element;
	targetElement: HTMLElement;
}

interface ActivateAnnotationRequest {
	annotation: Annotation;
	shouldOpenInNewTab: boolean;
}

const { log } = logger.create('HighlightLinksCommand');
const clickableRoles = ['button', 'link', 'tab'];
const nativelyClickableElements = ['a', 'button', 'link', 'input', 'textarea', 'select'];
const linkAnnotationCharacters = 'sadfjklewcmpgh'.split(''); // use the same set as Vimium

export class HighlightLinksCommand implements Command {
	private annotations = new Map<string, Annotation>();
	private stopKeyListener$ = new Subject();
	private currentInput = '';

	readonly kind = CommandKind.HighlighLinks;

	async execute(ct?: CancellationToken): Promise<void> {
		log('Executing highlight links command.');

		const clickableElements = await getVisibleClickableElements();
		log(`Found ${clickableElements.size} visible clickable elements.`);

		if (!ct || !ct.isCancellationRequested) {
			this.annotateElements(clickableElements);

			const selectedAnnotation = await this.waitForAnnotationSelection(ct);
			if (selectedAnnotation) {
				this.activateAnnotation(selectedAnnotation);
			}

			this.cleanupDomAndStopListeners();
		}
	}

	private cleanupDomAndStopListeners(): void {
		log('Deactivating highligh links command.');

		this.stopKeyListener$.next();
		for (const { annotationElement } of this.annotations.values()) {
			document.body.removeChild(annotationElement);
		}

		this.annotations.clear();
	}

	/**
	 * Add annotations to a set of clickable elements.
	 *
	 * An annotation is composed of a container div with spans around each character making up the
	 * label. E.g.
	 * <div>
	 *   <span>{charactOne}</span>
	 *   <span>{charactTwo}</span>
	 * </div>
	 */
	private annotateElements(clickableElements: Set<ClickableElementEntry>): void {
		const annotationLabels = getAnnotationLabels(clickableElements.size);

		let i = 0;
		for (const { element: targetElement, boundingRect } of clickableElements.values()) {
			const label = annotationLabels[i++];
			const annotationElement = createAnnotationElement(boundingRect, label);

			document.body.appendChild(annotationElement);
			this.annotations.set(label, {
				label,
				annotationElement,
				targetElement: targetElement as HTMLElement,
			});
		}
	}

	private waitForAnnotationSelection(
		ct?: CancellationToken
	): Promise<ActivateAnnotationRequest | null> {
		const donePromise = new DeferredPromise<ActivateAnnotationRequest | null>();
		if (ct) {
			ct.register(() => {
				log('Canceling highlight links command because token has been canceled.');
				donePromise.resolve(null);
			});
		}

		// suppress keydown events in our special input so no other commands are invoked
		fromEvent<KeyboardEvent>(document, 'keydown')
			.pipe(
				filter(event => !(event.metaKey || event.ctrlKey)),
				map(event => ({ event, lowerCaseKey: event.key.toLowerCase() })),
				filter(
					({ lowerCaseKey }) =>
						lowerCaseKey === 'escape' ||
						lowerCaseKey === 'backspace' ||
						linkAnnotationCharacters.indexOf(lowerCaseKey) !== -1
				),
				takeUntil(this.stopKeyListener$)
			)
			.subscribe(({ event, lowerCaseKey }) => {
				event.stopPropagation();
				event.preventDefault();

				switch (lowerCaseKey) {
					case 'escape':
						log('Escape entered in highlight links command.');
						donePromise.resolve(null);
						return;

					case 'backspace':
						this.currentInput = this.currentInput.slice(0, this.currentInput.length - 1);
						log(
							`Backspace entered in highlight links command. Current input: ${this.currentInput}`
						);

						this.shadeAnnotationLabelsToMatchInput();
						break;

					default:
						this.currentInput += lowerCaseKey;
						log(`Current input in highlight links command: ${this.currentInput}`);

						const annotation = this.annotations.get(this.currentInput);
						if (annotation) {
							donePromise.resolve({
								annotation,
								shouldOpenInNewTab: event.shiftKey,
							});
							return;
						}

						this.shadeAnnotationLabelsToMatchInput();
						break;
				}
			});

		// exit the command if the user interacts with the page
		fromEvent(document, 'click').subscribe(() => {
			log('Canceling highlight links command because of document click.');
			donePromise.resolve(null);
		});

		return donePromise.promise;
	}

	private activateAnnotation({ annotation, shouldOpenInNewTab }: ActivateAnnotationRequest) {
		const { targetElement } = annotation;

		if (shouldOpenInNewTab && isAnchorElement(targetElement) && targetElement.href) {
			log(`Activating annotation in new tab. Link: ${targetElement.href}`);

			const message: OpenInNewTabBackgroundScriptCommand = {
				kind: BackgroundScriptCommandKind.OpenInNewTab,
				data: {
					href: targetElement.href,
				},
			};
			chrome.runtime.sendMessage(message);
		} else {
			log('Activating annotation by click:', annotation);

			targetElement.focus();
			targetElement.click();
		}
	}

	private shadeAnnotationLabelsToMatchInput() {
		for (const { label, annotationElement } of this.annotations.values()) {
			const characterSpans = annotationElement.children;
			let i = 0;

			// grey out characters that match the current input
			if (label.startsWith(this.currentInput)) {
				for (; i < this.currentInput.length; i++) {
					(characterSpans[i] as HTMLSpanElement).style.color = '#AAAAAA';
				}
			}

			// and reset all other label characters
			for (; i < characterSpans.length; i++) {
				(characterSpans[i] as HTMLSpanElement).style.color = 'black';
			}
		}
	}
}

function createAnnotationElement(boundingRect: ClientRect, label: string) {
	const annotationElement = document.createElement('div');

	annotationElement.style.cssText = `
			 top: ${boundingRect.top}px;
			 left: ${boundingRect.left}px;
			 background: -webkit-gradient(linear, 0% 0%, 0% 100%, from(rgb(255, 247, 133)), to(rgb(255, 197, 66)));
			 border-color: rgb(227, 190, 35);
			 border-image: initial;
			 border-radius: 3px;
			 border-style: solid;
			 border-width: 1px;
			 box-shadow: rgba(0, 0, 0, 0.3) 0px 3px 7px 0px;
			 font-size: 12px;
			 font-weight: bold;
			 overflow: hidden;
			 padding: 1px 3px 0px;
			 position: absolute;
			 white-space: nowrap;
			 z-index: 9999999;
		 `;

	label.split('').forEach(labelChar => {
		const characterSpan = document.createElement('span');
		characterSpan.textContent = labelChar.toUpperCase();
		annotationElement.appendChild(characterSpan);
	});

	return annotationElement;
}

function getVisibleClickableElements(): Promise<Set<ClickableElementEntry>> {
	const elements = Array.from(document.getElementsByTagName('*'));
	const clickableElements = elements.filter(element => {
		const role = (element.getAttribute('role') || '').toLowerCase();
		const isClickable =
			nativelyClickableElements.indexOf(element.tagName.toLowerCase()) !== -1 ||
			element.hasAttribute('onclick') ||
			isBooleanAttributeSet(element, 'contentEditable') ||
			clickableRoles.indexOf(role) !== -1;

		return !isHiddenOrDisabled(element) && isClickable;
	});

	const visibleElementsPromise = new DeferredPromise<Set<ClickableElementEntry>>();
	const intersectionObserver = new IntersectionObserver(
		entries => {
			const visibleElements = new Set<ClickableElementEntry>(
				entries
					.filter(entry => entry.isIntersecting)
					.map(entry => ({ element: entry.target, boundingRect: entry.boundingClientRect }))
			);

			visibleElementsPromise.resolve(visibleElements);
			intersectionObserver.disconnect();
		},
		{ root: null } // intersection with the viewport
	);
	clickableElements.forEach(e => intersectionObserver.observe(e));

	return visibleElementsPromise.promise;
}

function getAnnotationLabels(minimumCount: number): string[] {
	if (minimumCount <= linkAnnotationCharacters.length) {
		return [...linkAnnotationCharacters];
	}

	const labels = [];
	for (const ch1 of linkAnnotationCharacters) {
		for (const ch2 of linkAnnotationCharacters) {
			labels.push(`${ch1}${ch2}`);
			if (labels.length >= minimumCount) {
				return labels;
			}
		}
	}

	// if there are more links on a page than this, don't bother...
	return labels;
}
