import { DeferredPromise } from './deferred-promise';
import { ClickableElementEntry } from '../types';

const clickableRoles = ['button', 'link', 'tab'];
const nativelyClickableElements = ['a', 'button', 'link', 'input', 'textarea', 'select'];

export function getVisibleClickableElements(): Promise<Set<ClickableElementEntry>> {
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

export function isAnchorElement(element: HTMLElement): element is HTMLAnchorElement {
	return element.tagName.toLowerCase() === 'a';
}

export function isHiddenOrDisabled(element: Element) {
	return (
		(element.tagName.toLowerCase() === 'input' &&
			(element as HTMLInputElement).type === 'hidden') ||
		isBooleanAttributeSet(element, 'disabled') ||
		isBooleanAttributeSet(element, 'aria-hidden') ||
		isBooleanAttributeSet(element, 'aria-disabled')
	);
}

export function isBooleanAttributeSet(element: Element, attrName: string) {
	return (
		element.hasAttribute(attrName) &&
		(element.getAttribute(attrName) === '' ||
			element.getAttribute(attrName)!.toLowerCase() === 'true')
	);
}
