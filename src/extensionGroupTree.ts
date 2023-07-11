
import * as vscode from 'vscode';
import { ExtensionEntry, QuickPickExtensionItem } from './extensionEntry';
import { ExtensionGroupRepository } from './extensionGroupRepository';
import { ExtensionGroupEntry } from './extensionGroupEntry';
import { GroupedExtensionEntry } from './groupedExtensionEntry';

export class ExtensionGroupTreeProvider implements
    vscode.TreeDataProvider<ExtensionGroupEntry | GroupedExtensionEntry>,
    vscode.TreeDragAndDropController<ExtensionGroupEntry | GroupedExtensionEntry> {

    // for view update
    private _onDidChangeTreeData: vscode.EventEmitter<ExtensionGroupEntry | GroupedExtensionEntry | undefined | null | void>;
    readonly onDidChangeTreeData: vscode.Event<ExtensionGroupEntry | GroupedExtensionEntry | undefined | null | void>;

    constructor(private _extensionGruopRepository: ExtensionGroupRepository) {
        // for view update
        this._onDidChangeTreeData = new vscode.EventEmitter<ExtensionGroupEntry | GroupedExtensionEntry | undefined | null | void>();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ExtensionGroupEntry | GroupedExtensionEntry): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: ExtensionGroupEntry | GroupedExtensionEntry | undefined): vscode.ProviderResult<(ExtensionGroupEntry | GroupedExtensionEntry)[]> {
        if (element === undefined) {
            return this._extensionGruopRepository.getGroupList();
        } else if (element instanceof ExtensionGroupEntry) {
            return element.extensionEntries;
        } else {
            return [];
        }
    }

    getGroupList(): string[] {
        return this._extensionGruopRepository.getGroupList().map((extension: ExtensionGroupEntry) => { return extension.label; });
    }

    async createNewGroup(groupName: string) {
        // TODO: check uniqueness of group name
        this._extensionGruopRepository.updateGroup(new ExtensionGroupEntry(groupName, []));
        this.refresh();
    }

    async removeGroup(node: ExtensionGroupEntry) {
        this._extensionGruopRepository.removeGroup(node.label);
        this.refresh();
    }

    ////////////////////////////////////////
    // code for TreeDragAndDropController //
    ////////////////////////////////////////
    dropMimeTypes: readonly string[] = ['application/vnd.code.tree.extension-group-view'];
    dragMimeTypes: readonly string[] = [];

    async handleDrop(target: ExtensionGroupEntry | GroupedExtensionEntry | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        if (!target) {
            // GUARD
            return;
        }

        if (target instanceof GroupedExtensionEntry) {
            if (!target.parent) {
                // GUARD
                return;
            }
            target = target.parent as ExtensionGroupEntry;
        }

        const item = dataTransfer.get('application/vnd.code.tree.extension-group-view');
        if (!item) {
            // GUARD
            return;
        }

        let labelList = target.extensionEntries.map((entry) => { return entry.label; });
        let entries: ExtensionEntry[] = JSON.parse(item.value);
        let extensions = entries
            .filter((entry) => { return !labelList.includes(entry.label); })
            .map((entry) => { return entry.extension; });
        target.addExtensions(extensions);
        this._extensionGruopRepository.updateGroup(target);

        this.refresh();
    }
}

export { ExtensionGroupEntry };
