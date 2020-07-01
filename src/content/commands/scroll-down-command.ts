import { Command, CommandKind } from '../../types';
import { isScrollable } from '../../util/dom-utils';

export class ScrollDownCommand implements Command {
	readonly kind = CommandKind.ScrollDown;

	execute() {
		(isScrollable(document.activeElement) ? document.activeElement! : window).scrollBy({
			left: 0,
			top: 200,
			behavior: 'smooth',
		});
	}
}
