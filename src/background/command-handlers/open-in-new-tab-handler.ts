import { BackgroundScriptCommandHandler, OpenInNewTabBackgroundScriptCommand } from '../../types';

export class OpenInNewTabHandler
	implements BackgroundScriptCommandHandler<OpenInNewTabBackgroundScriptCommand> {
	execute(command: OpenInNewTabBackgroundScriptCommand, sender: chrome.runtime.MessageSender) {
		const {
			data: { href },
		} = command;

		chrome.tabs.create({
			url: href,
			active: true,
			index: sender.tab && sender.tab.index + 1,
		});
	}
}
