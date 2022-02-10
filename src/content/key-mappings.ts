import { Command } from '../types';
import * as commands from './commands';

interface CommandConstructor {
	new (): Command;
}

interface CommandConfig {
	ctor: CommandConstructor;
	requiresShift?: boolean;
}

// Note: all shortcuts must use the ctrl key as well.
// `key` corresponds to KeyboardEvent.key. When the user is hold shift,
// event.key is the uppercase character (if applicable).
// E.g., the user is holding "ctrl+shift+P", event.key === 'P' and
//event.shiftKey === true, so the proper keyMapping entry would be "P"
// and not "p".
export const defaultKeyMappings: { [key: string]: CommandConfig } = {
	l: { ctor: commands.HighlightLinksCommand },
	p: { ctor: commands.DumpLogsCommand },
	d: { ctor: commands.DuplicateTabCommand },
	b: { ctor: commands.GoBackCommand },
	f: { ctor: commands.GoForwardCommand },
	j: { ctor: commands.ScrollDownCommand },
	k: { ctor: commands.ScrollUpCommand },
	ArrowLeft: { ctor: commands.MoveTabLeftCommand, requiresShift: true },
	ArrowRight: { ctor: commands.MoveTabRightCommand, requiresShift: true },
};
