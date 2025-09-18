import { vi } from 'vitest';

// Mock VS Code API
const mockVSCode = {
	window: {
		registerWebviewViewProvider: vi.fn(),
		showInformationMessage: vi.fn(),
		showErrorMessage: vi.fn(),
	},
	Uri: {
		joinPath: vi.fn((base, ...paths) => ({
			fsPath: [base.fsPath, ...paths].join('/'),
			toString: () => `file://${[base.fsPath, ...paths].join('/')}`,
		})),
	},
	WebviewViewProvider: class MockWebviewViewProvider {},
	ExtensionContext: class MockExtensionContext {
		globalState = {
			get: vi.fn(),
			update: vi.fn(),
		};
		extensionUri = { fsPath: '/mock/extension/path' };
	},
};

// Make vscode available globally for tests
global.vscode = mockVSCode;
