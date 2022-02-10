import { BackgroundScriptCommandHandler, MoveTabBackgroundScriptCommand } from '../../types';

export class MoveTabHandler
	implements BackgroundScriptCommandHandler<MoveTabBackgroundScriptCommand> {
	execute(command: MoveTabBackgroundScriptCommand, sender: chrome.runtime.MessageSender) {
		const {
			data: { direction },
		} = command;

		if (!sender.tab || !sender.tab.id) {
			return;
		}

		chrome.tabs.move(sender.tab.id, {
			index: direction === 'left' ? sender.tab.index - 1 : sender.tab.index + 1,
		});
	}
}
