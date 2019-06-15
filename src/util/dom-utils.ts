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
