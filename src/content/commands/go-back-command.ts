import { Command, CommandKind } from '../../types';

export class GoBackCommand implements Command {
	readonly kind = CommandKind.GoBack;

	execute() {
		window.history.back();
	}
}
