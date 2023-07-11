// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { InstalledExtensionsTreeProvider, DragFromInstalledController } from './installedExtensionsTree';
import { ExtensionGroupEntry, ExtensionGroupTreeProvider } from './extensionGroupTree';
import { ExtensionGroupRepository } from './extensionGroupRepository';
import { ExtensionRepository } from './extensionRepository';
import { GroupedExtensionEntry } from './groupedExtensionEntry';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Setup view for installed extension management
	let extensionRepository = new ExtensionRepository(context);
	let installedExtensionList = extensionRepository.getExtensionEntryList();
	const installedExtensionsTreeProvider = new InstalledExtensionsTreeProvider(installedExtensionList);
	const dragFromInstalledController = new DragFromInstalledController();
	vscode.window.createTreeView('installed-list-view', {
		treeDataProvider: installedExtensionsTreeProvider,
		dragAndDropController: dragFromInstalledController,
		canSelectMany: true
	});

	// Setup view for extension group management
	let extensionGroupRepository = new ExtensionGroupRepository(context, extensionRepository);
	const extensionGroupTreeProvider =
		new ExtensionGroupTreeProvider(extensionGroupRepository);
	/// vscode.window.registerTreeDataProvider('extension-group-view', extensionGroupTreeProvider);
	vscode.window.createTreeView('extension-group-view', {
		treeDataProvider: extensionGroupTreeProvider,
		dragAndDropController: extensionGroupTreeProvider,
		canSelectMany: true
});
	
	///////////////////////
	// Register Commands //
	///////////////////////
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'extension-management-utility.create-new-group',
			async () => {
				const groupName = await vscode.window.showInputBox({ title: 'Input new extension group name.' });
				if (groupName !== undefined) {
					await extensionGroupTreeProvider.createNewGroup(groupName);
					extensionGroupTreeProvider.refresh();
				}
			}),
		vscode.commands.registerCommand(
			'extension-management-utility.rename-group',
			async (node: ExtensionGroupEntry) => {
				const groupName = await vscode.window.showInputBox({ title: 'Rename extension group name.', "value": node.label });
				if (groupName) {
					extensionGroupRepository.renameGroup(node.label, groupName);
					extensionGroupTreeProvider.refresh();
				}
			}),
		vscode.commands.registerCommand(
			'extension-management-utility.add-extension-to-group',
			async (node: ExtensionGroupEntry) => {
				let quickPickExtensionItems = installedExtensionsTreeProvider.getQuickPickExtensionItems();
				await node.addExtensionsViaQuickPick(quickPickExtensionItems);
				extensionGroupTreeProvider.refresh();
			}),
		vscode.commands.registerCommand(
			'extension-management-utility.remove-extension-from-group',
			async (node: GroupedExtensionEntry, multiSelectNodes?: GroupedExtensionEntry[]) => {
				(multiSelectNodes || [node]).map((node) => {
					node.parent.removeExtensionEntry(node);
					extensionGroupRepository.updateGroup(node.parent);
				});
				extensionGroupTreeProvider.refresh();
			}),
		vscode.commands.registerCommand(
			'extension-management-utility.remove-group',
			async (node: ExtensionGroupEntry, multiSelectNodes?: ExtensionGroupEntry[]) => {
				(multiSelectNodes || [node]).map((node) => { extensionGroupTreeProvider.removeGroup(node); });
				extensionGroupTreeProvider.refresh();
			}),
		vscode.commands.registerCommand(
			'extension-management-utility.export-extension-groups',
			async () => {
				let jsonObj: { [member: string]: string[] | string } = {};
				jsonObj['extension-management-utility-version'] = context.extension.packageJSON['version'];
				for (let entry of extensionGroupRepository.getGroupList()) {
					jsonObj[entry.label] = entry.extensionEntries.map((entry) => { return entry.extension.id; });
				}
				vscode.commands.executeCommand("workbench.action.files.newUntitledFile").then(() => {
					let editor = vscode.window.activeTextEditor;
					if (editor) {
						let location = editor.document.positionAt(0);
						editor.edit(editBuilder => { editBuilder.insert(location, "extension-group-list.json"); });
						return vscode.commands.executeCommand("workbench.action.files.saveAs");
					}
				}).then(() => {
					let editor = vscode.window.activeTextEditor;
					if (editor) {
						let location = editor.document.positionAt(0);
						let range = editor.document.getWordRangeAtPosition(location, new RegExp("extension-group-list.json"));
						if (range) {
							editor.edit(editBuilder => { editBuilder.replace(range as vscode.Range, JSON.stringify(jsonObj)); });
							vscode.commands.executeCommand("editor.action.formatDocument");
							vscode.window.activeTextEditor?.document.save();
						}
					}
				});;
			}),
	);

}

// This method is called when your extension is deactivated
export function deactivate() {}
