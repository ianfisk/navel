import { ExtensionOptions } from '../types';

export const DISABLED_SITE_REGEXES_STORAGE_KEY = 'disabledSiteRegexs';

export async function getExtensionOptions(): Promise<ExtensionOptions> {
	const disabledSiteRegexs: string[] = await new Promise((resolve) => {
		chrome.storage.sync.get([DISABLED_SITE_REGEXES_STORAGE_KEY], (items) => {
			const disabledSiteRegexs = items[DISABLED_SITE_REGEXES_STORAGE_KEY];

			resolve(Array.isArray(disabledSiteRegexs) ? disabledSiteRegexs : []);
		});
	});

	return { disabledSiteRegexs };
}

function saveOptions() {
	const disabledSitesTextArea = document.getElementById(
		'disabled-sites'
	) as HTMLTextAreaElement | null;
	const disabledSiteRegexs = disabledSitesTextArea?.value?.split(/\r?\n/).filter((x) => !!x);

	chrome.storage.sync.set(
		{
			[DISABLED_SITE_REGEXES_STORAGE_KEY]: disabledSiteRegexs,
		},
		() => {
			const status = document.getElementById('status');

			if (status) {
				status.textContent = '✅';
				setTimeout(() => {
					status!.textContent = '';
				}, 3000);
			}
		}
	);
}

async function populateOptions() {
	const { disabledSiteRegexs } = await getExtensionOptions();
	const disabledSitesTextArea = document.getElementById(
		'disabled-sites'
	) as HTMLTextAreaElement | null;

	if (disabledSitesTextArea) {
		disabledSitesTextArea.textContent = disabledSiteRegexs.join('\n');
	}
}

(function main() {
	const saveButton = document.getElementById('save-button');
	saveButton?.addEventListener('click', () => saveOptions());

	populateOptions();
})();
