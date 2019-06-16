import { Command, CommandKind } from '../../types';

export class ScrollUpCommand implements Command {
	readonly kind = CommandKind.ScrollUp;

	execute() {
		window.scrollBy({
			left: 0,
			top: -200,
			behavior: 'smooth',
		});
	}
}
