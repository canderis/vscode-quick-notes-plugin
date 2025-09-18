import { vi } from 'vitest';

export const window = {
	registerWebviewViewProvider: vi.fn(),
	showInformationMessage: vi.fn(),
	showErrorMessage: vi.fn(),
};

export const Uri = {
	joinPath: vi.fn((base: any, ...paths: string[]) => ({
		fsPath: [base.fsPath, ...paths].join('/'),
		toString: () => `file://${[base.fsPath, ...paths].join('/')}`,
	})),
};

export class WebviewViewProvider {}

export class ExtensionContext {
	globalState = {
		get: vi.fn(),
		update: vi.fn(),
	};
	extensionUri = { fsPath: '/mock/extension/path' };
}
