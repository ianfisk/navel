import { CancellationToken } from 'poli-c';

export enum CommandKind {
	HighlighLinks = 'highlightLinks',
	DumpLogs = 'dumpLogs',
	DuplicateTab = 'duplicateTab',
	GoBack = 'goBack',
	GoForward = 'goForward',
	ScrollDown = 'scrollDown',
	ScrollUp = 'scrollUp',
}

export interface Command {
	kind: CommandKind;
	execute(ct?: CancellationToken): Promise<void> | void;
}

export enum BackgroundScriptCommandKind {
	OpenInNewTab = 'openInNewTab',
	DuplicateTab = 'duplicateTab',
}

export interface BackgroundScriptCommand {
	kind: BackgroundScriptCommandKind;
}

export interface OpenInNewTabBackgroundScriptCommand extends BackgroundScriptCommand {
	kind: BackgroundScriptCommandKind.OpenInNewTab;
	data: {
		href: string;
	};
}

export interface BackgroundScriptCommandHandler<T extends BackgroundScriptCommand> {
	execute(command: T, sender: chrome.runtime.MessageSender): void;
}

export interface ClickableElementEntry {
	element: Element;
	boundingRect: ClientRect;
}
