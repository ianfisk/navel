import {
	Command,
	CommandKind,
	BackgroundScriptCommandKind,
	BackgroundScriptCommand,
} from '../../types';

export class DuplicateTabCommand implements Command {
	readonly kind = CommandKind.DuplicateTab;

	execute() {
		const message: BackgroundScriptCommand = {
			kind: BackgroundScriptCommandKind.DuplicateTab,
		};
		chrome.runtime.sendMessage(message);
	}
}
