import * as vscode from "vscode";

async function insertPositions(separator: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const input = await vscode.window.showInputBox({
    prompt: "How many positions? (2–20)",
    placeHolder: "e.g. 4",
    validateInput: (v) => {
      const n = parseInt(v);
      if (isNaN(n) || n < 2 || n > 20) return "Enter a number between 2 and 20";
      return null;
    },
  });
  if (input === undefined) return;

  const n = parseInt(input);
  const body = Array(n).fill("${1}").join(separator);
  editor.insertSnippet(new vscode.SnippetString(body));
}

async function distributeToCursors() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  if (editor.selections.length < 2) {
    vscode.window.showErrorMessage(
      "Magic Split: Place 2 or more cursors first (Alt+Click)."
    );
    return;
  }

  const input = await vscode.window.showInputBox({
    prompt: "Words to distribute (space-separated)",
    placeHolder: "e.g. red green blue",
  });
  if (input === undefined) return;

  const words = input.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return;

  const sels = editor.selections;
  const count = Math.min(sels.length, words.length);

  await editor.edit((editBuilder) => {
    for (let i = 0; i < count; i++) {
      editBuilder.replace(sels[i], words[i]);
    }
  });

  if (words.length < sels.length) {
    editor.selections = editor.selections.slice(0, words.length);
  }
}

async function insertWithSeparator() {
  const config = vscode.workspace.getConfiguration("magicSplit");
  const presets = config.get<{ label: string; value: string; enabled: boolean }[]>(
    "customSeparators",
    []
  );

  const items = presets
    .filter((p) => p.enabled)
    .map((p) => ({ label: p.label, description: JSON.stringify(p.value) }));

  if (items.length === 0) {
    vscode.window.showWarningMessage(
      "No separators configured. Add entries to magicSplit.customSeparators in settings."
    );
    return;
  }

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: "Choose a separator",
  });
  if (!picked) return;

  const sep = presets.find((p) => p.label === picked.label)!.value;
  await insertPositions(sep);
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("magicSplit.insertInline", () => insertPositions(" ")),
    vscode.commands.registerCommand("magicSplit.insertMultiLine", () => insertPositions("\n")),
    vscode.commands.registerCommand("magicSplit.insertWithSeparator", () => insertWithSeparator()),
    vscode.commands.registerCommand("magicSplit.distributeToCursors", () => distributeToCursors())
  );
}

export function deactivate() {}
