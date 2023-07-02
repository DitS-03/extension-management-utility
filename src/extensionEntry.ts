
import * as vscode from 'vscode';
import * as path from 'path';

export class ExtensionEntry extends vscode.TreeItem {
    constructor(public extension: vscode.Extension<any>) {
        super(extension.packageJSON['displayName']);
        if (extension.packageJSON['icon'] !== undefined) {
            this.iconPath = path.join(extension.extensionPath,extension.packageJSON['icon']);
        }
        this.contextValue = "ExtensionEntry";
    };
}

export interface QuickPickExtensionItem extends vscode.QuickPickItem {
    entry : ExtensionEntry;
}