import * as vscode from 'vscode';
import { NotesProvider } from './notesProvider';

export function activate(context: vscode.ExtensionContext) {
	const sidebarProvider = new NotesProvider(context.extensionUri, context);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('c-notes-sidebar', sidebarProvider));
}

export function deactivate() {}
