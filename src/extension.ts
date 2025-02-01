import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Store all notes globally
let notes: { [key: string]: string } = {};

// Global decoration type
let gutterDecorationType: vscode.TextEditorDecorationType;

// Path to the notes file
function getNotesFilePath(context: vscode.ExtensionContext): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        // Save in the workspace root
        return path.join(workspaceFolders[0].uri.fsPath, '.code-notes.json');
    } else {
        // Fallback to global storage
        return path.join(context.globalStorageUri.fsPath, 'code-notes.json');
    }
}

// Load notes from file
function loadNotes(context: vscode.ExtensionContext): void {
    const notesFilePath = getNotesFilePath(context);
    console.log('Loading notes from:', notesFilePath);

    try {
        if (fs.existsSync(notesFilePath)) {
            const data = fs.readFileSync(notesFilePath, 'utf8');
            notes = JSON.parse(data);
            console.log('Notes loaded:', notes);
        } else {
            console.log('No notes file found. Starting with an empty notes object.');
        }
    } catch (error) {
        console.error('Failed to load notes:', error);
    }
}

// Save notes to file
function saveNotes(context: vscode.ExtensionContext): void {
    const notesFilePath = getNotesFilePath(context);
    console.log('Saving notes to:', notesFilePath);

    try {
        // Ensure the directory exists
        const dir = path.dirname(notesFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Save the notes
        fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2), 'utf8');
        console.log('Notes saved:', notes);
    } catch (error) {
        console.error('Failed to save notes:', error);
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Notes Extension is active!');

    // Initialize gutter decoration
    initializeGutterDecoration();

    // Load notes from file
    loadNotes(context);

    // Command to add a note
    let disposableAddNote = vscode.commands.registerCommand('code-canvas.addNote', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const line = editor.selection.active.line;
        const filePath = editor.document.uri.fsPath;
        const noteKey = `${filePath}::${line}`; // Use '::' as the separator

        vscode.window.showInputBox({ prompt: 'Enter your note' }).then((note) => {
            if (note) {
                notes[noteKey] = note;
                saveNotes(context); // Save notes to file
                updateDecorations(editor);
                vscode.window.showInformationMessage('Note added!');
            }
        });
    });

    // Command to edit a note
    let disposableEditNote = vscode.commands.registerCommand('code-canvas.editNote', (args) => {
        if (!args || args.filePath === undefined || args.line === undefined) {
            vscode.window.showErrorMessage('Invalid arguments passed to Edit Note command.');
            return;
        }

        const { filePath, line } = args;
        const noteKey = `${filePath}::${line}`;

        vscode.window.showInputBox({
            prompt: 'Edit your note',
            value: notes[noteKey] || ''
        }).then((newNote) => {
            if (newNote !== undefined) {
                notes[noteKey] = newNote;
                saveNotes(context); // Save notes to file
                const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === filePath);
                if (editor) {
                    updateDecorations(editor);
                }
                vscode.window.showInformationMessage('Note updated!');
            }
        });
    });

    context.subscriptions.push(disposableAddNote, disposableEditNote);

    // Hover Provider for notes
    const hoverProvider = vscode.languages.registerHoverProvider({ pattern: '**/*' }, {
        provideHover(document, position) {
            const filePath = document.uri.fsPath;
            const noteKey = `${filePath}::${position.line}`; // Use '::' as the separator

            if (notes[noteKey]) {
                const markdown = new vscode.MarkdownString();
                markdown.appendMarkdown(`📝 **Note:** ${notes[noteKey]}\n\n`);
                markdown.appendMarkdown(
                    `[✏️ **Edit Note**](command:code-canvas.editNote?${encodeURIComponent(JSON.stringify({ filePath, line: position.line }))})`
                );
                markdown.isTrusted = true; // Allow command links
                return new vscode.Hover(markdown);
            }
            return null;
        }
    });

    context.subscriptions.push(hoverProvider);

    // Apply decorations to open editors on activation
    vscode.window.visibleTextEditors.forEach(updateDecorations);

    // Update decorations when active editor changes
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            updateDecorations(editor);
        }
    }, null, context.subscriptions);
}

// Initialize gutter decoration (only once)
function initializeGutterDecoration() {
    gutterDecorationType = vscode.window.createTextEditorDecorationType({
        gutterIconPath: vscode.Uri.parse('data:image/svg+xml;base64,' + Buffer.from(`
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                <path fill="#FFA500" d="M2 2h12v12H2z"/>
                <text x="8" y="11" font-size="10" text-anchor="middle" fill="white">📝</text>
            </svg>
        `).toString('base64')),
        gutterIconSize: 'contain'
    });
}

// Update decorations with stored notes
function updateDecorations(editor: vscode.TextEditor): void {
    const decorations: vscode.DecorationOptions[] = [];

    for (const [key, note] of Object.entries(notes)) {
        const [filePath, lineStr] = key.split('::'); // Use '::' as the separator
        const normalizedFilePath = filePath.replace(/\\/g, '/').toLowerCase();
        const normalizedEditorPath = editor.document.uri.fsPath.replace(/\\/g, '/').toLowerCase();

        if (normalizedFilePath === normalizedEditorPath) {
            const line = parseInt(lineStr, 10);
            if (!isNaN(line) && line >= 0 && line < editor.document.lineCount) {
                const range = new vscode.Range(line, 0, line, 0);
                const markdown = new vscode.MarkdownString(
                    `📝 **Note:** ${note}\n\n[✏️ **Edit Note**](command:code-canvas.editNote?${encodeURIComponent(JSON.stringify({ filePath, line }))})`
                );
                markdown.isTrusted = true;

                decorations.push({
                    range,
                    hoverMessage: markdown
                });
            }
        }
    }

    console.log('Applying decorations:', decorations.length, 'for', editor.document.uri.fsPath);
    editor.setDecorations(gutterDecorationType, decorations);
}

export function deactivate() {
    console.log('Code Notes Extension deactivated');
}