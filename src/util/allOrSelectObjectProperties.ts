import * as vscode from 'vscode';

import { selectDialogForever } from "./selectDialogForever";

export async function allOrSelectObjectProperties(textForAll: string, textForSelectionDialog: string, targetObj: { [member: string]: any }): Promise<{ [member: string]: any; } | undefined> {
    let importType = [textForAll, textForSelectionDialog];
    let importTypeSelected = await selectDialogForever(importType);
    if (!importTypeSelected) {
        return undefined; // GUARD
    } else if (importTypeSelected === importType[1]) {
        let importGroups = await vscode.window.showQuickPick(Object.keys(targetObj), { canPickMany: true });
        if (!importGroups) {
            return undefined; // GUARD
        }
        let skipGroups = Object.keys(targetObj).filter((key) => { return !importGroups?.includes(key); });
        for (let skipGroupName of skipGroups) {
            delete targetObj[skipGroupName];
        }
    }
    return targetObj;
}