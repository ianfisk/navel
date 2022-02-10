import {
	BackgroundScriptCommand,
	BackgroundScriptCommandKind,
	MoveTabBackgroundScriptCommand,
	OpenInNewTabBackgroundScriptCommand,
} from '../types';
import { OpenInNewTabHandler } from './command-handlers';
import { DuplicateTabHandler } from './command-handlers/duplicate-tab-handler';
import { MoveTabHandler } from './command-handlers/move-tab-handler';

chrome.runtime.onMessage.addListener((request: BackgroundScriptCommand, sender) => {
	const { kind } = request;

	switch (kind) {
		case BackgroundScriptCommandKind.OpenInNewTab:
			new OpenInNewTabHandler().execute(request as OpenInNewTabBackgroundScriptCommand, sender);
			break;

		case BackgroundScriptCommandKind.DuplicateTab:
			new DuplicateTabHandler().execute(request, sender);
			break;

		case BackgroundScriptCommandKind.MoveTab:
			new MoveTabHandler().execute(request as MoveTabBackgroundScriptCommand, sender);
			break;

		default:
			throw new Error('Unknown command sent to background script');
	}
});
