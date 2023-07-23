import * as vscode from 'vscode';
import { ExtensionEntry } from './extensionEntry';
import { getDiffOfArrays } from './util/getDiffOfArrays';

export class ExtensionRepository {
 
    private _extensionList: vscode.Extension<any>[] = [];

    constructor() {
        this.updateExtensionList();
    }

    updateExtensionList() : { removed: Array<string>, added: Array<string> } {
        let oldExtensionList = this._extensionList;
        this._extensionList = vscode.extensions.all.filter(
            // predicate to remove built-in plugins
            (extension) => { return !extension.id.startsWith('vscode.') && !extension.id.startsWith('ms-vscode.'); });
        return getDiffOfArrays(
            oldExtensionList.map((extension) => { return extension.id; }),
            this._extensionList.map((extension) => { return extension.id; }));
    }

    getExtensionEntryList(): ExtensionEntry[] {
        return this._extensionList.map((extension) => { return new ExtensionEntry(extension); });
    }

    getExtensions(ids: string[]): vscode.Extension<any>[] {
        return this._extensionList.filter( (extension) => { return ids.includes(extension.id); });
    }

    async installExtensions(extensionIds: string[]): Promise<string[]> {
        let installedExtensions: string[] = [];
        for (let extensionId of extensionIds) {
            if (!this._extensionList.find((extension) => { return extension.id === extensionId; })) {
                await vscode.commands.executeCommand("workbench.extensions.installExtension", extensionId);
                installedExtensions.push(extensionId);
            }
        }
        return installedExtensions;
    }
}