import { CancellationTokenSource } from 'poli-c';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import { logger } from '../util/logger';
import { defaultKeyMappings } from './key-mappings';

const { log } = logger.create('ContentScript');

function main() {
	let activeCommandCts = new CancellationTokenSource();

	fromEvent<KeyboardEvent>(document, 'keydown')
		.pipe(filter(event => event.ctrlKey && event.key !== 'Control'))
		.subscribe((event: KeyboardEvent) => {
			log(`Looking for command for key ${event.key}.`);

			const commandConstructor = defaultKeyMappings[event.key];
			if (commandConstructor) {
				activeCommandCts.cancel();
				activeCommandCts.dispose();
				activeCommandCts = new CancellationTokenSource();

				const command = new commandConstructor();
				log(`Command ${command.kind} requested.`);

				command.execute(activeCommandCts.token);
			}
		});
}

main();
