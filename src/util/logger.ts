interface LogEntry {
	tag: string;
	message: any;
	timestampMs: number;
	optionalParams: any[];
}

const maxLogEntries = 25;
const allLogs: LogEntry[] = [];

function doConsoleLog(logEntry: LogEntry) {
	const { tag, message, timestampMs, optionalParams } = logEntry;
	const logTime = new Date(timestampMs);
	const timeStr = `%c${logTime.getHours()}:${logTime.getMinutes()}:${logTime.getSeconds()}.${logTime.getMilliseconds()}`;

	console.log(
		timeStr.padEnd(16) + `%c${tag} |`,
		'color: #AAAAAA; font-style: italic;',
		'color: #001f3f; font-weight: bold;',
		message,
		...optionalParams
	);
}

function addLogEntry(entry: LogEntry) {
	allLogs.push(entry);
	if (allLogs.length > maxLogEntries) {
		allLogs.shift();
	}
}

export const logger = {
	create(tag: string) {
		return {
			log(message: any, ...optionalParams: any[]) {
				const logEntry: LogEntry = { tag, message, optionalParams, timestampMs: Date.now() };
				addLogEntry(logEntry);

				if (process.env.NODE_ENV !== 'production') {
					doConsoleLog(logEntry);
				}
			},
		};
	},

	dumpLogs() {
		for (const entry of allLogs) {
			doConsoleLog(entry);
		}
	},
};
