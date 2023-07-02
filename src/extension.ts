// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ExtensionEntry } from './extensionEntry';
import { InstalledExtensionsTreeProvider, DragFromInstalledController } from './installedExtensionsTree';
import { ExtensionGroupEntry, GroupedExtensionEntry, ExtensionGroupTreeProvider } from './extensionGroupTree';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	/////////////////
	// Setup Views //
	/////////////////
	const installedExtensionsTreeProvider = new InstalledExtensionsTreeProvider();
	const dragFromInstalledController = new DragFromInstalledController();
	vscode.window.registerTreeDataProvider('installed-list-view', installedExtensionsTreeProvider);
	vscode.window.createTreeView('installed-list-view', {
		treeDataProvider: installedExtensionsTreeProvider, dragAndDropController: dragFromInstalledController, canSelectMany: true});
	
	const extensionGroupTreeProvider = new ExtensionGroupTreeProvider();
	/// vscode.window.registerTreeDataProvider('extension-group-view', extensionGroupTreeProvider);
	vscode.window.createTreeView('extension-group-view', {
		treeDataProvider: extensionGroupTreeProvider, dragAndDropController: extensionGroupTreeProvider});
	
	///////////////////////
	// Register Commands //
	///////////////////////
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'extension-management-utility.create-new-group',
			async () => { await extensionGroupTreeProvider.createNewGroup(); }),
		vscode.commands.registerCommand(
			'extension-management-utility.rename-group',
			async (node : ExtensionGroupEntry) => {
				await node.renameGroup();
				extensionGroupTreeProvider.refresh();
			}),
		vscode.commands.registerCommand(
			'extension-management-utility.add-extension-to-group',
			async (node : ExtensionGroupEntry) => {
				let quickPickExtensionItems = installedExtensionsTreeProvider.getQuickPickExtensionItems();
				await node.addExtensionsViaQuickPick(quickPickExtensionItems);
				extensionGroupTreeProvider.refresh();
			}),
		vscode.commands.registerCommand(
			'extension-management-utility.remove-extension-from-group',
			async (node : GroupedExtensionEntry) => {
				node.parent.removeExtensionEntry(node);
				extensionGroupTreeProvider.refresh();
			})
	);

}

// This method is called when your extension is deactivated
export function deactivate() {}
