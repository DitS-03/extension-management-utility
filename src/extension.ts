// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { InstalledExtensionsTreeProvider, DragFromInstalledController } from './installedExtensionsTree';
import { ExtensionGroupTreeProvider } from './extensionGroupTree';
import { ExtensionGroupRepository } from './extensionGroupRepository';
import { ExtensionRepository } from './extensionRepository';
import { GroupedExtensionEntry } from './groupedExtensionEntry';
import { saveFileDialogWithDefaultName } from './util/saveFileDialogWithDefaultName';
import { ExtensionGroupEntry } from './extensionGroupEntry';

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
				extensionGroupRepository.updateGroup(node);
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
				await saveFileDialogWithDefaultName("extension-group-list.json", JSON.stringify(jsonObj));
			}),
		vscode.commands.registerCommand(
			'extension-management-utility.import-extension-groups',
			async () => {
				const options: vscode.OpenDialogOptions = {
					canSelectMany: false,
					openLabel: 'Select',
					canSelectFiles: true,
					canSelectFolders: false
				};

				let fileUri = await vscode.window.showOpenDialog(options);
				if (fileUri && fileUri[0]) {
					let result = await vscode.window.showTextDocument(fileUri[0]);
					let jsonStr = result.document.getText();
					let jsonObj = JSON.parse(jsonStr);
					delete jsonObj["extension-management-utility-version"];
					await extensionGroupRepository.importGroups(jsonObj);
				}

				extensionGroupTreeProvider.refresh();
			})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
