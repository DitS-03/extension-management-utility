
import * as vscode from 'vscode';
import { ExtensionEntry, QuickPickExtensionItem } from './extensionEntry';
import { ExtensionRepository } from './extensionRepository';

export class InstalledExtensionsTreeProvider implements vscode.TreeDataProvider<ExtensionEntry>{

    private _onDidChangeTreeData: vscode.EventEmitter<ExtensionEntry | undefined | null | void>;
    readonly onDidChangeTreeData: vscode.Event<ExtensionEntry | undefined | null | void>;

    constructor(private _extensionRepository: ExtensionRepository) {
        this._onDidChangeTreeData = new vscode.EventEmitter<ExtensionEntry | undefined | null | void>();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.refresh();
    };

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ExtensionEntry): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    };

    getChildren(element?: ExtensionEntry | undefined): vscode.ProviderResult<ExtensionEntry[]> {
        if (element === undefined) {
            return Promise.resolve(this._extensionRepository.getExtensionEntryList());
        } else {
            return Promise.resolve(new Array<ExtensionEntry>(0));
        }
    };

    getQuickPickExtensionItems() : QuickPickExtensionItem[] {
        return this._extensionRepository.getExtensionEntryList().map(
            (extension: ExtensionEntry) => {
                return {
                    label: extension.label,
                    description: extension.description,
                    entry: extension
                } as QuickPickExtensionItem; } );
    }
}

export class DragFromInstalledController implements vscode.TreeDragAndDropController<ExtensionEntry> {

    dropMimeTypes: readonly string[] = [];
    dragMimeTypes: readonly string[] = ['application/vnd.code.tree.extension-group-view'];

    async handleDrag(source: readonly ExtensionEntry[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        dataTransfer.set('application/vnd.code.tree.extension-group-view', new vscode.DataTransferItem(source));
    }
}