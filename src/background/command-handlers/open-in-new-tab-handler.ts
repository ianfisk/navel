import { BackgroundScriptCommandHandler, OpenInNewTabBackgroundScriptCommand } from '../../types';
import { logger } from '../../util/logger';

const { log } = logger.create('Bg_OpenInNewTabHandler');

export class OpenInNewTabHandler
	implements BackgroundScriptCommandHandler<OpenInNewTabBackgroundScriptCommand> {
	execute(command: OpenInNewTabBackgroundScriptCommand, sender: chrome.runtime.MessageSender) {
		const {
			data: { href },
		} = command;

		log(`Creating new tab with href: ${href}`);
		chrome.tabs.create({
			url: href,
			active: true,
			index: sender.tab && sender.tab.index + 1,
		});
	}
}
