import {
	Command,
	CommandKind,
	BackgroundScriptCommandKind,
	MoveTabBackgroundScriptCommand,
} from '../../types';

export class MoveTabRightCommand implements Command {
	readonly kind = CommandKind.MoveTabRight;

	execute() {
		const message: MoveTabBackgroundScriptCommand = {
			kind: BackgroundScriptCommandKind.MoveTab,
			data: {
				direction: 'right',
			},
		};
		chrome.runtime.sendMessage(message);
	}
}
