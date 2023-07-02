
import * as vscode from 'vscode';
import * as path from 'path';
import { ExtensionEntry, QuickPickExtensionItem } from './extensionEntry';

export class InstalledExtensionsTreeProvider implements vscode.TreeDataProvider<ExtensionEntry>{

    private _extensionList : ExtensionEntry[];

    constructor() {
        this._extensionList = vscode.extensions.all
            .filter( (extension) => { return !extension.id.startsWith('vscode.'); } )
            .map( (extension) => { return new ExtensionEntry(extension); } );
    };

    getTreeItem(element: ExtensionEntry): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    };

    getChildren(element?: ExtensionEntry | undefined): vscode.ProviderResult<ExtensionEntry[]> {
        if (element === undefined) {
            return this._extensionList;
        } else {
            return new Array<ExtensionEntry>(0);
        }
    };

    getQuickPickExtensionItems() : QuickPickExtensionItem[] {
        return this._extensionList.map(
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