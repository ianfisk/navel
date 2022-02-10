import { CancellationToken } from 'poli-c';
import { fromEvent, Subject } from 'rxjs';
import { map, takeUntil, filter } from 'rxjs/operators';
import {
	CommandKind,
	Command,
	BackgroundScriptCommandKind,
	OpenInNewTabBackgroundScriptCommand,
	ClickableElementEntry,
} from '../../types';
import { DeferredPromise } from '../../util/deferred-promise';
import { getVisibleClickableElements, isAnchorElement } from '../../util/dom-utils';
import { logger } from '../../util/logger';

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
const annotationStyleClassName = '_navel-annotation';
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

		if ((!ct || !ct.isCancellationRequested) && clickableElements.size) {
			this.annotateElements(clickableElements);

			const selectedAnnotation = await this.waitForAnnotationSelection(ct);
			if (selectedAnnotation) {
				this.activateAnnotation(selectedAnnotation);
			}

			this.cleanupDomAndStopListeners();
		}
	}

	private cleanupDomAndStopListeners(): void {
		log('Deactivating highlight links command.');

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
		const fragment = document.createDocumentFragment();

		let i = 0;
		for (const { element: targetElement, boundingRect } of clickableElements.values()) {
			const label = annotationLabels[i++];
			if (!label) continue;

			const annotationElement = createAnnotationElement(boundingRect, label);

			fragment.appendChild(annotationElement);
			this.annotations.set(label, {
				label,
				annotationElement,
				targetElement: targetElement as HTMLElement,
			});
		}

		document.body.appendChild(fragment);
	}

	private waitForAnnotationSelection(
		ct?: CancellationToken
	): Promise<ActivateAnnotationRequest | null> {
		const donePromise = new DeferredPromise<ActivateAnnotationRequest | null>();
		let unregisterTokenListener: () => void | undefined;
		if (ct) {
			unregisterTokenListener = ct.register(() => {
				log('Canceling highlight links command because token has been canceled.');
				donePromise.resolve(null);
			});
		}

		const doExit = (results: ActivateAnnotationRequest | null) => {
			if (unregisterTokenListener) {
				unregisterTokenListener();
			}

			donePromise.resolve(results);
		};

		// suppress keydown events in our special input so no other commands are invoked
		fromEvent<KeyboardEvent>(document, 'keydown')
			.pipe(
				filter((event) => !(event.metaKey || event.ctrlKey)),
				map((event) => ({ event, lowerCaseKey: event.key.toLowerCase() })),
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
						doExit(null);
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
							doExit({
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
		fromEvent(document, 'click')
			.pipe(takeUntil(this.stopKeyListener$))
			.subscribe(() => {
				log('Canceling highlight links command because of document click.');
				doExit(null);
			});
		fromEvent(document, 'scroll')
			.pipe(takeUntil(this.stopKeyListener$))
			.subscribe(() => {
				log('Canceling highlight links command because of document scroll.');
				doExit(null);
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

	annotationElement.className = annotationStyleClassName;
	annotationElement.style.cssText = `
			 top: ${boundingRect.top}px;
			 left: ${boundingRect.left}px;
		 `;

	label.split('').forEach((labelChar) => {
		const characterSpan = document.createElement('span');
		characterSpan.textContent = labelChar.toUpperCase();
		annotationElement.appendChild(characterSpan);
	});

	return annotationElement;
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
