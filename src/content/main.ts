import { CancellationTokenSource } from 'poli-c';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import { getExtensionOptions } from '../options';
import { logger } from '../util/logger';
import { defaultKeyMappings } from './key-mappings';

const { log } = logger.create('ContentScript');

async function isDisabledSite(): Promise<boolean> {
	const { disabledSiteRegexs } = await getExtensionOptions();

	return disabledSiteRegexs.some(disabledSiteRegex => {
		try {
			log(`Checking if current site matches ${disabledSiteRegex}`);

			var re = new RegExp(disabledSiteRegex);
			return re.test(location.href);
		} catch (e) {
			log(`Caught exception when checking disabled sites: `, disabledSiteRegex, e);
			return false;
		}
	});
}

async function main() {
	if (await isDisabledSite()) {
		log(`Navel is disabled for this site. Exiting.`);
		return;
	}

	let activeCommandCts = new CancellationTokenSource();

	fromEvent<KeyboardEvent>(document, 'keydown')
		.pipe(filter((event) => event.ctrlKey && event.key !== 'Control'))
		.subscribe((event: KeyboardEvent) => {
			log(`Looking for command for key ${event.key}.`);

			const commandConfig = defaultKeyMappings[event.key];
			if (commandConfig) {
				const { ctor: commandCtor, requiresShift } = commandConfig;
				if (requiresShift && !event.shiftKey) {
					// Potentially reachable for certain keys (if Apple didn't hijack ctrl+ArrowLeft, e.g.).
					log(`Command found for ${event.key} but required shift modifier is missing`);
					return;
				}

				activeCommandCts.cancel();
				activeCommandCts.dispose();
				activeCommandCts = new CancellationTokenSource();

				const command = new commandCtor();
				log(`Command ${command.kind} requested.`);

				command.execute(activeCommandCts.token);
			}
		});
}

main();
