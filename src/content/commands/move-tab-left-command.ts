import {
	Command,
	CommandKind,
	BackgroundScriptCommandKind,
	MoveTabBackgroundScriptCommand,
} from '../../types';

export class MoveTabLeftCommand implements Command {
	readonly kind = CommandKind.MoveTabLeft;

	execute() {
		const message: MoveTabBackgroundScriptCommand = {
			kind: BackgroundScriptCommandKind.MoveTab,
			data: {
				direction: 'left',
			},
		};
		chrome.runtime.sendMessage(message);
	}
}
