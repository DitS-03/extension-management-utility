
import * as vscode from 'vscode';

export async function selectDialogForever(items: string[], cancelItem: string = "Cancel") : Promise<string|undefined> {
    let result : string | undefined = undefined;
    while (!result) {
        result = await vscode.window.showQuickPick(items.concat([cancelItem]));
        if (result === cancelItem) {
            return Promise.resolve(undefined);
        }
    }
    return Promise.resolve(result);
}