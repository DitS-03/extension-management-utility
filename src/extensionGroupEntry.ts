import * as vscode from 'vscode';
import { QuickPickExtensionItem } from './extensionEntry';
import { GroupedExtensionEntry } from './groupedExtensionEntry';

export class ExtensionGroupEntry extends vscode.TreeItem {

    extensionEntries: GroupedExtensionEntry[] = [];

    constructor(public label: string, extensions: vscode.Extension<any>[]) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        this.contextValue = "ExtensionGroup";
        this.addExtensions(extensions);
    };

    async renameGroup(groupName: string) {
        this.label = groupName;
    }

    async addExtensionsViaQuickPick(candidates: QuickPickExtensionItem[]) {
        let idList = this.extensionEntries.map((entry) => { return entry.extension.id; });
        let pickPickExtensionItems = candidates.filter(
            (item) => { return !idList.includes(item.entry.extension.id); });
        const results = await vscode.window.showQuickPick(pickPickExtensionItems, { canPickMany: true });
        if (results) {
            this.addExtensions(results.map((item) => { return item.entry.extension; }));
        }
    }

    addExtensions(extensions: vscode.Extension<any>[]) {
        let parent = this;
        let entries = extensions.map((extension) => { return new GroupedExtensionEntry(extension, parent); });
        this.extensionEntries.push(...entries);
    }

    removeExtensionEntry(entry: GroupedExtensionEntry): void {
        let index = this.extensionEntries.indexOf(entry);
        this.extensionEntries.splice(index, 1);
    }
}