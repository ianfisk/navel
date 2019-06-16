import { Command, CommandKind } from '../../types';

export class GoForwardCommand implements Command {
	readonly kind = CommandKind.GoBack;

	execute() {
		window.history.forward();
	}
}
