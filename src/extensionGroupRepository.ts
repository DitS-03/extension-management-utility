import * as vscode from 'vscode';
import { ExtensionRepository } from './extensionRepository';
import { selectDialogForever } from './util/selectDialogForever';
import { ExtensionGroupEntry } from './extensionGroupEntry';

class InstallWaitedItem {
    constructor(public extensionId: string,  public extensionGroupEntry: ExtensionGroupEntry) {}
}

export class ExtensionGroupRepository {

    private _storageKey: string = 'extension-management-utility.group-map';
    private _extensionGroupMap: Map<string, ExtensionGroupEntry> = new Map<string, ExtensionGroupEntry>();
    private _groupsData: { [member: string]: string[] } = {};
    private _installWaitedItems: InstallWaitedItem[] = [];

    constructor(private _context: vscode.ExtensionContext, private _extensionRepository: ExtensionRepository) {
        this._loadExtensionGroups();
    }

    private _loadExtensionGroups() {
        // load group information from storage
        this._groupsData = this._context.globalState.get(this._storageKey, {});

        // convert group information into list of ExtensionGroupEntry
        Object.entries(this._groupsData).map(([groupName, extensionIds]) => { 
            let extensions = this._extensionRepository.getExtensions(extensionIds);
            this._extensionGroupMap.set(groupName, new ExtensionGroupEntry(groupName, extensions));
        });
    }

    getGroupList(): ExtensionGroupEntry[] {
        return Array.from(this._extensionGroupMap.values());
    }

    removeGroup(groupName: string) {
        delete this._groupsData[groupName];
        this._extensionGroupMap.delete(groupName);
        this._saveGroupInformation();
    }

    renameGroup(originalName: string, newName: string) {
        let groupEntry = this._extensionGroupMap.get(originalName);
        if (groupEntry) {
            groupEntry.label = newName;
            this._extensionGroupMap.set(newName, groupEntry);
            this._extensionGroupMap.delete(originalName);

            this._groupsData[newName] = this._groupsData[originalName];
            delete this._groupsData[originalName];

            this._saveGroupInformation();
        }
    }

    async updateGroup(entry: ExtensionGroupEntry) {
        this._extensionGroupMap.set(entry.label, entry);
        this._groupsData[entry.label] =
            entry.extensionEntries.map((entry) => { return entry.extension.id; });
        await this._saveGroupInformation();
    }

    private async _saveGroupInformation() {
        await this._context.globalState.update(this._storageKey, this._groupsData);
    }

    async importGroups(groupsData: { [member: string]: string[] }) {
        for (let [groupName, extensionIds] of Object.entries(groupsData)) {
            if (this._groupsData.hasOwnProperty(groupName)) {
                let items = [
                    `Skip import "${groupName}"`,
                    `Overwrite "${groupName}"`,
                    `Merge old and new "${groupName}"`,
                    `Import "${groupName}" as other name`
                ];
                switch (await selectDialogForever(items)) {
                    case undefined: continue;
                    case items[0]: continue;
                    case items[1]: break;
                    case items[2]:
                        let currentExtensionIds = groupsData[groupName];
                        let uniqueIds = new Set(currentExtensionIds.concat(extensionIds));
                        extensionIds = Array.from(uniqueIds);
                        break;
                    default:
                        let newGroupName: string | undefined = groupName;
                        while (newGroupName && newGroupName === groupName) {
                            newGroupName = await vscode.window.showInputBox({ title: 'Rename extension group name.', "value": newGroupName });
                        }
                        if (!newGroupName) {
                            continue;
                        } else {
                            groupName = newGroupName;
                        }
                        break;
                }
            }
            let extensionGroupEntry = new ExtensionGroupEntry(groupName, this._extensionRepository.getExtensions(extensionIds));
            this.updateGroup(extensionGroupEntry);
            let installedIds = await this._extensionRepository.installExtensions(extensionIds);
            this._installWaitedItems.push(...installedIds.map((id) => { return new InstallWaitedItem(id, extensionGroupEntry); }) );
        }
    }

    processInstallWaitedList() {
        for (let item of this._installWaitedItems) {
            let extension = vscode.extensions.getExtension(item.extensionId);
            if (extension) {
                item.extensionGroupEntry.addExtensions([extension]);
                this.updateGroup(item.extensionGroupEntry);
            }
        }
        this._installWaitedItems = [];
    }

    eraseRemovedExtensions(removedExtensionIds : string[]) {
        for (let id of removedExtensionIds) {
            for (let entry of this._extensionGroupMap.values()) {
                entry.removeExtensionEntry(id);
            }
        }
    }
}