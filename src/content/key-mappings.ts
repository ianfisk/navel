import { Command } from '../types';
import * as commands from './commands';

interface CommandConstructor {
	new (): Command;
}

// Note: all shortcuts must use the ctrl key as well.
export const defaultKeyMappings: { [key: string]: CommandConstructor } = {
	l: commands.HighlightLinksCommand,
	p: commands.DumpLogsCommand,
	d: commands.DuplicateTabCommand,
	b: commands.GoBackCommand,
	f: commands.GoForwardCommand,
};
