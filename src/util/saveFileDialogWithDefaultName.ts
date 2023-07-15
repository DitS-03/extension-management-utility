
import * as vscode from 'vscode';

export async function saveFileDialogWithDefaultName(defaultName: string, content: string) {
    await vscode.commands.executeCommand("workbench.action.files.newUntitledFile");
    let editor = vscode.window.activeTextEditor;
    if (editor) {
        let location = editor.document.positionAt(0);
        await editor.edit(editBuilder => { editBuilder.insert(location, defaultName); });
        await vscode.commands.executeCommand("workbench.action.files.saveAs");
        editor = vscode.window.activeTextEditor;
        if(editor){
            let range = editor.document.getWordRangeAtPosition(location, new RegExp(defaultName));
            if (range) {
                await editor.edit(editBuilder => { editBuilder.replace(range as vscode.Range, content); });
                await vscode.commands.executeCommand("editor.action.formatDocument");
                await vscode.window.activeTextEditor?.document.save();
            }
        }
    }
}