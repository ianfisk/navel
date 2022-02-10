import { CancellationToken } from 'poli-c';

export enum CommandKind {
	HighlighLinks = 'highlightLinks',
	DumpLogs = 'dumpLogs',
	DuplicateTab = 'duplicateTab',
	GoBack = 'goBack',
	GoForward = 'goForward',
	ScrollDown = 'scrollDown',
	ScrollUp = 'scrollUp',
	MoveTabLeft = 'moveTabLeft',
	MoveTabRight = 'moveTabRight',
}

export interface Command {
	kind: CommandKind;
	execute(ct?: CancellationToken): Promise<void> | void;
}

export enum BackgroundScriptCommandKind {
	OpenInNewTab = 'openInNewTab',
	DuplicateTab = 'duplicateTab',
	MoveTab = 'moveTab',
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

export interface MoveTabBackgroundScriptCommand extends BackgroundScriptCommand {
	kind: BackgroundScriptCommandKind.MoveTab;
	data: {
		direction: 'left' | 'right';
	};
}

export interface BackgroundScriptCommandHandler<T extends BackgroundScriptCommand> {
	execute(command: T, sender: chrome.runtime.MessageSender): void;
}

export interface ClickableElementEntry {
	element: Element;
	boundingRect: ClientRect;
}

export interface ExtensionOptions {
	disabledSiteRegexs: string[];
}
