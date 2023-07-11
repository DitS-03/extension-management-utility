import * as vscode from 'vscode';
import { ExtensionEntry } from './extensionEntry';
import { ExtensionGroupEntry } from './extensionGroupTree';

export class ExtensionRepository {

    private _extensionList: vscode.Extension<any>[] = [];

    constructor(private _context: vscode.ExtensionContext) {
        this._updateExtensionList();
    }

    private _updateExtensionList() {
        this._extensionList = vscode.extensions.all.filter(
            // predicate to remove built-in plugins
            (extension) => { return !extension.id.startsWith('vscode.'); });
    }

    getExtensionEntryList(): ExtensionEntry[] {
        return this._extensionList.map((extension) => { return new ExtensionEntry(extension); });
    }

    getExtensions(ids: string[]): vscode.Extension<any>[] {
        return this._extensionList.filter( (extension) => { return ids.includes(extension.id); });
    }
}