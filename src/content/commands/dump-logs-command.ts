import { Command, CommandKind } from '../../types';
import { logger } from '../../util/logger';

export class DumpLogsCommand implements Command {
	readonly kind = CommandKind.DumpLogs;

	execute() {
		logger.dumpLogs();
		return Promise.resolve();
	}
}
