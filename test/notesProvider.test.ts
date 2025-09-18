import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotesProvider } from '../src/notesProvider';

describe('NotesProvider', () => {
	let notesProvider: NotesProvider;
	let mockContext: any;
	let mockWebviewView: any;

	beforeEach(() => {
		mockContext = {
			globalState: {
				get: vi.fn(),
				update: vi.fn(),
			},
			extensionUri: { fsPath: '/mock/extension/path' },
		};

		mockWebviewView = {
			webview: {
				options: {},
				html: '',
				postMessage: vi.fn(),
				onDidReceiveMessage: vi.fn(),
				cspSource: 'file://mock',
			},
		};

		notesProvider = new NotesProvider(mockContext.extensionUri, mockContext);
	});

	describe('saveNotes', () => {
		it('should save notes to global state', () => {
			const testNotes = 'Test notes content';

			// Access private method for testing
			(notesProvider as any).saveNotes(testNotes);

			expect(mockContext.globalState.update).toHaveBeenCalledWith('notesContent', testNotes);
		});
	});

	describe('loadNotes', () => {
		it('should load notes from global state and send to webview', () => {
			const testNotes = 'Saved notes content';
			mockContext.globalState.get.mockReturnValue(testNotes);

			// Set up the view
			(notesProvider as any)._view = mockWebviewView;

			// Access private method for testing
			(notesProvider as any).loadNotes();

			expect(mockContext.globalState.get).toHaveBeenCalledWith('notesContent', '');
			expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
				type: 'loadNotes',
				value: testNotes,
			});
		});

		it('should not send message if no view is available', () => {
			mockContext.globalState.get.mockReturnValue('test notes');

			// Don't set up the view
			(notesProvider as any)._view = undefined;

			// Access private method for testing
			(notesProvider as any).loadNotes();

			expect(mockWebviewView.webview.postMessage).not.toHaveBeenCalled();
		});
	});

	describe('resolveWebviewView', () => {
		it('should set up webview options and load notes', () => {
			const postMessageSpy = vi.spyOn(mockWebviewView.webview, 'postMessage');
			const onDidReceiveMessageSpy = vi.spyOn(mockWebviewView.webview, 'onDidReceiveMessage');

			notesProvider.resolveWebviewView(mockWebviewView);

			expect(mockWebviewView.webview.options).toEqual({
				enableScripts: true,
				localResourceRoots: [mockContext.extensionUri],
			});
			expect(onDidReceiveMessageSpy).toHaveBeenCalled();
			expect(mockWebviewView.webview.html).toBeDefined();
		});
	});
});
