
import * as vscode from 'vscode';
import { ExtensionEntry, QuickPickExtensionItem } from './extensionEntry';

export class GroupedExtensionEntry extends ExtensionEntry {
    constructor(extensionEntry: ExtensionEntry, public parent: ExtensionGroupEntry) {
        super(extensionEntry.extension);
        this.contextValue = "GroupedExtension";
    }
}

export class ExtensionGroupEntry extends vscode.TreeItem {
    constructor(public label: string, public extensionEntries: GroupedExtensionEntry[]) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        this.contextValue = "ExtensionGroup";
    };

    async renameGroup() {
        const groupName = await vscode.window.showInputBox({title: 'Rename extension group name.', "value": this.label});
        if (groupName !== undefined) {
            this.label = groupName;
        }
    }

    async addExtensionsViaQuickPick(candidates : QuickPickExtensionItem[]) {
        let labelList = this.extensionEntries.map( (entry) => { return entry.label; });
        let pickPickExtensionItems = candidates.filter(
            (item) => { return !labelList.includes(item.label); });
        const results = await vscode.window.showQuickPick(pickPickExtensionItems, {canPickMany: true});
        if (results) {
            this.addExtensions(results.map((item) => {return item.entry;}));
        }
    }

    addExtensions(extensions : ExtensionEntry[]) {
        let entries = extensions.map((item) => { return new GroupedExtensionEntry(item, this); });
        this.extensionEntries.push(...entries);
    }

    removeExtensionEntry(entry : GroupedExtensionEntry) : void {
        let index = this.extensionEntries.indexOf(entry);
        this.extensionEntries.splice(index, 1);
    }
}

export class ExtensionGroupTreeProvider implements 
    vscode.TreeDataProvider<ExtensionGroupEntry|GroupedExtensionEntry>,
    vscode.TreeDragAndDropController<ExtensionGroupEntry|GroupedExtensionEntry> {

    private _extensionGroupList : ExtensionGroupEntry[];

    // for view update
    private _onDidChangeTreeData: vscode.EventEmitter<ExtensionGroupEntry | GroupedExtensionEntry | undefined | null | void>;
    readonly onDidChangeTreeData: vscode.Event<ExtensionGroupEntry | GroupedExtensionEntry | undefined | null | void>;

    constructor() {
        this._extensionGroupList = [];

        // for view update
        this._onDidChangeTreeData = new vscode.EventEmitter<ExtensionGroupEntry | GroupedExtensionEntry | undefined | null | void>();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;

        // TODO: restore groups
    }

    refresh() : void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ExtensionGroupEntry | GroupedExtensionEntry): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: ExtensionGroupEntry | GroupedExtensionEntry | undefined): vscode.ProviderResult<(ExtensionGroupEntry | GroupedExtensionEntry)[]> {
        if (element === undefined) {
            return this._extensionGroupList;
        } else if (element instanceof ExtensionGroupEntry) {
            return (element as ExtensionGroupEntry).extensionEntries;
        } else {
            return [];
        }
    }

    getGroupList() : string[] {
        return this._extensionGroupList.map((extension : ExtensionGroupEntry) => { return extension.label; });
    }

    async createNewGroup(){
        const groupName = await vscode.window.showInputBox({title: 'Input new extension group name.'});
        if (groupName !== undefined) {

            // TODO: check uniqueness of group name

            this._extensionGroupList.push(new ExtensionGroupEntry(groupName, []));
            this.refresh();
        }
    }

    ////////////////////////////////////////
    // code for TreeDragAndDropController //
    ////////////////////////////////////////
    dropMimeTypes: readonly string[] = ['application/vnd.code.tree.extension-group-view'];
    dragMimeTypes: readonly string[] = [];

    async handleDrop(target: ExtensionGroupEntry|GroupedExtensionEntry | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        if (!target) {
            // GUARD
            return;
        }

        if (target instanceof GroupedExtensionEntry) {
            target = target.parent;
        }

        const item = dataTransfer.get('application/vnd.code.tree.extension-group-view');
        if (!item) {
            // GUARD
            return;
        }

        let labelList = target.extensionEntries.map( (entry) => { return entry.label; });
        let entries : ExtensionEntry[] = JSON.parse(item.value);
        entries = entries.filter((entry) => {return !labelList.includes(entry.label); });
        target.addExtensions(entries);
        this.refresh();
    }
}