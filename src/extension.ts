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
    vscode.commands.registerCommand("magicSplit.insertWithSeparator", () => insertWithSeparator())
  );
}

export function deactivate() {}
