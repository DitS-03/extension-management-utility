import * as vscode from 'vscode';
import { ExtensionEntry } from './extensionEntry';
import { ExtensionGroupEntry } from './extensionGroupEntry';

export class GroupedExtensionEntry extends ExtensionEntry {
    constructor(public extension: vscode.Extension<any>, public parent: ExtensionGroupEntry) {
        super(extension);
        this.contextValue = "GroupedExtension";
    };
}