import { BackgroundScriptCommandHandler, BackgroundScriptCommand } from '../../types';

export class DuplicateTabHandler
	implements BackgroundScriptCommandHandler<BackgroundScriptCommand> {
	execute(command: BackgroundScriptCommand, sender: chrome.runtime.MessageSender) {
		if (!sender.tab || !sender.tab.id) {
			return;
		}

		chrome.tabs.duplicate(sender.tab.id);
	}
}
