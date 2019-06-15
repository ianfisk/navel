import { CancellationTokenSource } from 'poli-c';
import { logger } from '../util/logger';
import { defaultKeyMappings } from './key-mappings';

const { log } = logger.create('ContentScript');

function main() {
	let activeCommandCts = new CancellationTokenSource();

	document.addEventListener('keydown', (event: KeyboardEvent) => {
		// as of right now, shortcuts must use the control key
		if (!event.ctrlKey || event.key === 'Control') {
			return;
		}

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
