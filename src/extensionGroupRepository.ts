import * as vscode from 'vscode';
import { ExtensionGroupEntry } from './extensionGroupTree';
import { ExtensionRepository } from './extensionRepository';
import { group } from 'console';

export class ExtensionGroupRepository {

    private _storageKey: string = 'extension-management-utility.group-map';
    private _extensionGroupMap: Map<string, ExtensionGroupEntry> = new Map<string, ExtensionGroupEntry>();
    private _groupsData: { [member: string]: string[] } = {};

    constructor(private _context: vscode.ExtensionContext, private _extensionRepository : ExtensionRepository) {
        this._loadExtensionGroups();
    }

    private _loadExtensionGroups() {
        // load group informations from storage
        this._groupsData = this._context.globalState.get(this._storageKey, {});

        // convert group informations into list of ExtensionGroupEntry
        Object.entries(this._groupsData).map(
            // convert group information into ExtensionGroupEntry
            ([groupName, extensionIds]) => { 
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
        this._saveGroupInformations();
    }

    renameGroup(originalName: string, newName: string) {
        let groupEntry = this._extensionGroupMap.get(originalName);
        if (groupEntry) {
            groupEntry.label = newName;
            this._extensionGroupMap.set(newName, groupEntry);
            this._extensionGroupMap.delete(originalName);

            this._groupsData[newName] = this._groupsData[originalName];
            delete this._groupsData[originalName];

            this._saveGroupInformations();
        }
    }

    updateGroup(entry: ExtensionGroupEntry) {
        this._extensionGroupMap.set(entry.label, entry);
        this._groupsData[entry.label] =
            entry.extensionEntries.map((entry) => { return entry.extension.id; });
        this._saveGroupInformations();
    }

    private _saveGroupInformations() {
        this._context.globalState.update(this._storageKey, this._groupsData);
    }
}