import { Command, CommandKind } from '../../types';

export class ScrollDownCommand implements Command {
	readonly kind = CommandKind.ScrollDown;

	execute() {
		window.scrollBy({
			left: 0,
			top: 150,
			behavior: 'smooth',
		});
	}
}
