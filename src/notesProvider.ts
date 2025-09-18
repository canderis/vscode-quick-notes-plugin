import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class NotesProvider implements vscode.WebviewViewProvider {
	_view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _context: vscode.ExtensionContext,
	) {}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Listen for messages from the Sidebar component and execute action
		webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case 'saveNotes': {
					this.saveNotes(data.value);
					break;
				}
				case 'loadNotes': {
					this.loadNotes();
					break;
				}
			}
		});

		// Load existing notes when webview is created
		this.loadNotes();
	}

	public revive(panel: vscode.WebviewView) {
		this._view = panel;
	}

	private saveNotes(text: string): void {
		this._context.globalState.update('notesContent', text);
	}

	private loadNotes(): void {
		const notesContent = this._context.globalState.get('notesContent', '');
		const showStatusMessages = vscode.workspace.getConfiguration('notesSidebar').get('showStatusMessages', true);
		if (this._view) {
			this._view.webview.postMessage({
				type: 'loadNotes',
				value: notesContent,
				showStatusMessages: showStatusMessages,
			});
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		// Read the HTML template file
		const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'webview.html');

		let htmlContent;
		try {
			htmlContent = fs.readFileSync(htmlPath, 'utf8');
		} catch (error) {
			// Fallback to inline HTML if file loading fails
			htmlContent = this._getFallbackHtml(webview, nonce);
		}

		// Replace template variables
		htmlContent = htmlContent.replace('{{cspSource}}', webview.cspSource).replace('{{nonce}}', nonce);

		return htmlContent;
	}

	private _getFallbackHtml(webview: vscode.Webview, nonce: string): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script nonce="${nonce}">
        const tsvscode = acquireVsCodeApi();
    </script>
    <style nonce="${nonce}">
        body { font-family: var(--vscode-font-family); padding: 16px; }
        .notes-textarea { width: 100%; height: 300px; }
    </style>
</head>
<body>
    <textarea id="notes-textarea" placeholder="Start typing your notes here..."></textarea>
    <script nonce="${nonce}">
        const textarea = document.getElementById('notes-textarea');
        const tsvscode = acquireVsCodeApi();

        // Load notes when page loads
        tsvscode.postMessage({ type: 'loadNotes' });

        // Auto-save on text change
        textarea.addEventListener('input', () => {
            tsvscode.postMessage({ type: 'saveNotes', value: textarea.value });
        });

        // Handle messages from extension
        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.type === 'loadNotes') {
                textarea.value = message.value || '';
            }
        });
    </script>
</body>
</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
