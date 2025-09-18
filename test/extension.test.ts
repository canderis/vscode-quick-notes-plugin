import { describe, it, expect, vi, beforeEach } from 'vitest';
import { activate, deactivate } from '../src/extension';

// Mock the NotesProvider
vi.mock('../src/notesProvider', () => ({
	NotesProvider: vi.fn().mockImplementation(() => ({
		// Mock implementation
	})),
}));

describe('Extension', () => {
	let mockContext: any;

	beforeEach(() => {
		mockContext = {
			extensionUri: { fsPath: '/mock/extension/path' },
			subscriptions: {
				push: vi.fn(),
			},
		};
	});

	describe('activate', () => {
		it('should register webview view provider', () => {
			activate(mockContext);

			expect(mockContext.subscriptions.push).toHaveBeenCalled();
		});
	});

	describe('deactivate', () => {
		it('should not throw when called', () => {
			expect(() => deactivate()).not.toThrow();
		});
	});
});
