import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class NotesProvider implements vscode.WebviewViewProvider {
	_view?: vscode.WebviewView;
	_doc?: vscode.TextDocument;

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
			console.log('Extension received message:', data);
			switch (data.type) {
				case 'onInfo': {
					if (!data.value) {
						return;
					}
					vscode.window.showInformationMessage(data.value);
					break;
				}
				case 'onError': {
					if (!data.value) {
						return;
					}
					vscode.window.showErrorMessage(data.value);
					break;
				}
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
		console.log('About to load notes, webview exists:', !!this._view);
		// Send a test message first
		if (this._view) {
			this._view.webview.postMessage({
				type: 'test',
				value: 'Hello from extension',
			});
		}
		this.loadNotes();
	}

	public revive(panel: vscode.WebviewView) {
		this._view = panel;
	}

	private saveNotes(text: string): void {
		console.log('Saving notes:', text.substring(0, 50) + '...');
		this._context.globalState.update('notesContent', text);
		console.log('Notes saved successfully');
	}

	private loadNotes(): void {
		const notesContent = this._context.globalState.get('notesContent', '');
		console.log('Loading notes:', notesContent.substring(0, 50) + '...');
		if (this._view) {
			this._view.webview.postMessage({
				type: 'loadNotes',
				value: notesContent,
			});
			console.log('Notes loaded and sent to webview');
		} else {
			console.log('No webview available to load notes');
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out/compiled/sidebar.js'));
		const webviewScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview.js'));
		const styleMainUri = '';

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		// Read the HTML template file
		const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'webview.html');
		console.log('Looking for HTML file at:', htmlPath);
		console.log('Extension URI:', this._extensionUri.fsPath);

		let htmlContent;
		try {
			htmlContent = fs.readFileSync(htmlPath, 'utf8');
			console.log('HTML file loaded successfully');
		} catch (error) {
			console.error('Failed to load HTML file:', error);
			// Fallback to inline HTML if file loading fails
			htmlContent = this._getFallbackHtml(webview, nonce, styleResetUri, styleVSCodeUri, styleMainUri, scriptUri);
		}

		// Replace template variables
		htmlContent = htmlContent
			.replace('{{cspSource}}', webview.cspSource)
			.replace('{{nonce}}', nonce)
			.replace('{{styleResetUri}}', styleResetUri.toString())
			.replace('{{styleVSCodeUri}}', styleVSCodeUri.toString())
			.replace('{{styleMainUri}}', styleMainUri)
			.replace('{{scriptUri}}', scriptUri.toString())
			.replace('{{webviewScriptUri}}', webviewScriptUri.toString());

		console.log('Generated nonce:', nonce);
		console.log('CSP Source:', webview.cspSource);
		console.log('HTML content length:', htmlContent.length);
		console.log('HTML contains nonce:', htmlContent.includes(nonce));

		return htmlContent;
	}

	private _getFallbackHtml(
		webview: vscode.Webview,
		nonce: string,
		styleResetUri: vscode.Uri,
		styleVSCodeUri: vscode.Uri,
		styleMainUri: string,
		scriptUri: vscode.Uri,
	): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleResetUri}" rel="stylesheet">
    <link href="${styleVSCodeUri}" rel="stylesheet">
    <link href="${styleMainUri}" rel="stylesheet">
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
