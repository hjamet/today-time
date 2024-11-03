import { App, Plugin, PluginSettingTab, Setting, TFile, TAbstractFile, SuggestModal } from 'obsidian';
const moment = require('moment');

interface MyPluginSettings {
	notePath: string;
	format: string;
	updateInterval: number;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	notePath: '',
	format: 'YYYY-MM-DD HH:mm:ss',
	updateInterval: 60
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
		}, this.settings.updateInterval * 1000);
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
			console.error('Error updating timestamp:', error);
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
			.setName('Note to update')
			.setDesc('Select the note to update')
			.addText(text => text
				.setPlaceholder('Click to select...')
				.setValue(this.plugin.settings.notePath)
				.setDisabled(true))
			.addButton(button => button
				.setButtonText('Browse')
				.onClick(() => {
					new FileSelectionModal(this.app, (file) => {
						this.plugin.settings.notePath = file.path;
						this.plugin.saveSettings();
						this.display();
					}).open();
				}));

		new Setting(containerEl)
			.setName('Date and time format')
			.setDesc('moment.js format (e.g., YYYY-MM-DD HH:mm:ss)')
			.addText(text => text
				.setPlaceholder('YYYY-MM-DD HH:mm:ss')
				.setValue(this.plugin.settings.format)
				.onChange(async (value) => {
					if (value.trim() === '') value = DEFAULT_SETTINGS.format;
					this.plugin.settings.format = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Update interval')
			.setDesc('Update frequency in seconds (minimum: 1)')
			.addText(text => text
				.setPlaceholder('60')
				.setValue(String(this.plugin.settings.updateInterval))
				.onChange(async (value) => {
					const numValue = Number(value);
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.updateInterval = numValue;
						await this.plugin.saveSettings();
						this.plugin.startAutoUpdate();
					}
				}));
	}
}
