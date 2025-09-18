import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotesProvider } from '../src/notesProvider';

describe('NotesProvider', () => {
	let notesProvider: NotesProvider;
	let mockContext: any;
	let mockWebviewView: any;

	beforeEach(() => {
		vi.clearAllMocks();

		// Reset the workspace configuration mock to default
		global.vscode.workspace.getConfiguration.mockReturnValue({
			get: vi.fn().mockReturnValue(false),
		});

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
		it('should load notes from global state and send to webview with setting enabled', async () => {
			const testNotes = 'Saved notes content';
			mockContext.globalState.get.mockReturnValue(testNotes);

			// Import vscode to access the mocked module
			const vscode = await import('vscode');

			// Mock the workspace configuration to return true for showStatusMessages
			const mockGetConfiguration = vi.fn().mockReturnValue({
				get: vi.fn().mockReturnValue(true),
			});
			vi.mocked(vscode.workspace.getConfiguration).mockImplementation(mockGetConfiguration);

			// Create a new provider instance with the mocked configuration
			notesProvider = new NotesProvider(mockContext.extensionUri, mockContext);

			// Set up the view
			(notesProvider as any)._view = mockWebviewView;

			// Access private method for testing
			(notesProvider as any).loadNotes();

			expect(mockContext.globalState.get).toHaveBeenCalledWith('notesContent', '');
			expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
				type: 'loadNotes',
				value: testNotes,
				showStatusMessages: true,
			});
		});

		it('should load notes with disabled status messages setting', async () => {
			const testNotes = 'Saved notes content';
			mockContext.globalState.get.mockReturnValue(testNotes);

			// Import vscode to access the mocked module
			const vscode = await import('vscode');

			// Mock the workspace configuration to return false for showStatusMessages
			const mockGetConfiguration = vi.fn().mockReturnValue({
				get: vi.fn().mockReturnValue(false),
			});
			vi.mocked(vscode.workspace.getConfiguration).mockImplementation(mockGetConfiguration);

			// Create a new provider instance with the mocked configuration
			notesProvider = new NotesProvider(mockContext.extensionUri, mockContext);

			// Set up the view
			(notesProvider as any)._view = mockWebviewView;

			// Access private method for testing
			(notesProvider as any).loadNotes();

			expect(mockContext.globalState.get).toHaveBeenCalledWith('notesContent', '');
			expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
				type: 'loadNotes',
				value: testNotes,
				showStatusMessages: false,
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
