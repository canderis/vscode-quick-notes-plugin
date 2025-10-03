import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class NotesProvider implements vscode.WebviewViewProvider {
	_view?: vscode.WebviewView;
	private _cachedHtml?: string;
	private _lastCspSource?: string;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _context: vscode.ExtensionContext,
	) {
		// Listen for configuration changes
		this._context.subscriptions.push(
			vscode.workspace.onDidChangeConfiguration((e) => {
				if (
					e.affectsConfiguration('notesSidebar.showStatusMessages') ||
					e.affectsConfiguration('notesSidebar.showHeader')
				) {
					// Reload notes to apply the new setting immediately
					this.loadNotes();
				}
			}),
		);
	}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		this._view = webviewView;

		// Set webview options once
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
			enableCommandUris: false,
		};

		// Set HTML content immediately
		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Set up message listener once
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
		const config = vscode.workspace.getConfiguration('notesSidebar');
		const showStatusMessages = config.get('showStatusMessages', true);
		const showHeader = config.get('showHeader', true);
		if (this._view) {
			this._view.webview.postMessage({
				type: 'loadNotes',
				value: notesContent,
				showStatusMessages: showStatusMessages,
				showHeader: showHeader,
			});
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const nonce = getNonce();

		// Use cached HTML if CSP source hasn't changed
		if (this._cachedHtml && this._lastCspSource === webview.cspSource) {
			// Only replace the nonce for security
			return this._cachedHtml.replace(/\{\{nonce\}\}/g, nonce);
		}

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
		htmlContent = htmlContent.replace(/\{\{cspSource\}\}/g, webview.cspSource).replace(/\{\{nonce\}\}/g, nonce);

		// Cache the processed HTML and CSP source
		this._cachedHtml = htmlContent;
		this._lastCspSource = webview.cspSource;

		return htmlContent;
	}

	private _getFallbackHtml(webview: vscode.Webview, nonce: string): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' {{cspSource}}; script-src 'nonce-{{nonce}}' {{cspSource}};">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script nonce="{{nonce}}">
        const tsvscode = acquireVsCodeApi();
    </script>
    <style nonce="{{nonce}}">
        body { font-family: var(--vscode-font-family); padding: 16px; }
        .notes-textarea { width: 100%; height: 300px; }
    </style>
</head>
<body>
    <textarea id="notes-textarea" placeholder="Start typing your notes here..."></textarea>
    <script nonce="{{nonce}}">
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
