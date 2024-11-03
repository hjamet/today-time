import { App, Plugin, PluginSettingTab, Setting, TFile, TAbstractFile, SuggestModal } from 'obsidian';
const moment = require('moment');

interface MyPluginSettings {
	notePath: string;
	format: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	notePath: '',
	format: 'YYYY-MM-DD HH:mm:ss'
}

export default class AutoUpdatePlugin extends Plugin {
	settings: MyPluginSettings;
	private intervalId: NodeJS.Timeout | null = null;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new AutoUpdateSettingTab(this.app, this));
		this.startAutoUpdate();
	}

	onunload() {
		this.stopAutoUpdate();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	startAutoUpdate() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
		}

		this.intervalId = setInterval(() => {
			this.updateNoteTimestamp();
		}, 1000);
	}

	stopAutoUpdate() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	private async updateNoteTimestamp() {
		if (!this.settings.notePath) return;

		const file = this.app.vault.getAbstractFileByPath(this.settings.notePath);
		if (!(file instanceof TFile)) return;

		try {
			const content = await this.app.vault.read(file);
			const now = moment();
			const formattedDateTime = now.format(this.settings.format);

			const newContent = this.updateFrontmatter(content, formattedDateTime);
			await this.app.vault.modify(file, newContent);
		} catch (error) {
			console.error('Erreur lors de la mise à jour du timestamp:', error);
		}
	}

	private updateFrontmatter(content: string, formattedDateTime: string) {
		const frontmatterRegex = /^---\n([\s\S]*?)\n---/;

		if (frontmatterRegex.test(content)) {
			return content.replace(frontmatterRegex, (match, frontmatter) => {
				const lines = frontmatter.split('\n');
				let todayFound = false;

				const updatedLines = lines.map((line: string) => {
					if (line.startsWith('today:')) {
						todayFound = true;
						return `today: "${formattedDateTime}"`;
					}
					return line;
				});

				if (!todayFound) {
					updatedLines.push(`today: "${formattedDateTime}"`);
				}

				return `---\n${updatedLines.join('\n')}\n---`;
			});
		} else {
			return `---\ntoday: "${formattedDateTime}"\n---\n\n${content}`;
		}
	}
}

class FileSelectionModal extends SuggestModal<TFile> {
	private onSelect: (file: TFile) => void;

	constructor(app: App, onSelect: (file: TFile) => void) {
		super(app);
		this.onSelect = onSelect;
	}

	getSuggestions(query: string): TFile[] {
		const files = this.app.vault.getMarkdownFiles();
		return files.filter(file =>
			file.path.toLowerCase().includes(query.toLowerCase())
		);
	}

	renderSuggestion(file: TFile, el: HTMLElement) {
		el.createEl("div", { text: file.path });
	}

	onChooseSuggestion(file: TFile, evt: MouseEvent | KeyboardEvent) {
		this.onSelect(file);
	}
}

class AutoUpdateSettingTab extends PluginSettingTab {
	plugin: AutoUpdatePlugin;

	constructor(app: App, plugin: AutoUpdatePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Note à mettre à jour')
			.setDesc('Sélectionnez la note à mettre à jour')
			.addText(text => text
				.setPlaceholder('Cliquez pour sélectionner...')
				.setValue(this.plugin.settings.notePath)
				.setDisabled(true))
			.addButton(button => button
				.setButtonText('Parcourir')
				.onClick(() => {
					new FileSelectionModal(this.app, (file) => {
						this.plugin.settings.notePath = file.path;
						this.plugin.saveSettings();
						this.display();
					}).open();
				}));

		new Setting(containerEl)
			.setName('Format de date et heure')
			.setDesc('Format moment.js (ex: YYYY-MM-DD HH:mm:ss)')
			.addText(text => text
				.setPlaceholder('YYYY-MM-DD HH:mm:ss')
				.setValue(this.plugin.settings.format)
				.onChange(async (value) => {
					if (value.trim() === '') value = DEFAULT_SETTINGS.format;
					this.plugin.settings.format = value;
					await this.plugin.saveSettings();
				}));
	}
}
