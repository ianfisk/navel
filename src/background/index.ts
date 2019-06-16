import {
	BackgroundScriptCommand,
	BackgroundScriptCommandKind,
	OpenInNewTabBackgroundScriptCommand,
} from '../types';
import { OpenInNewTabHandler } from './command-handlers';
import { DuplicateTabHandler } from './command-handlers/duplicate-tab-handler';

chrome.runtime.onMessage.addListener((request: BackgroundScriptCommand, sender) => {
	const { kind } = request;

	switch (kind) {
		case BackgroundScriptCommandKind.OpenInNewTab:
			new OpenInNewTabHandler().execute(request as OpenInNewTabBackgroundScriptCommand, sender);
			break;

		case BackgroundScriptCommandKind.DuplicateTab:
			new DuplicateTabHandler().execute(request, sender);
			break;

		default:
			throw new Error('Unknown command sent to background script');
	}
});
