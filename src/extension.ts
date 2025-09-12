import * as vscode from 'vscode';
import { execFile, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { diffLines, Change } from 'diff';

const out = vscode.window.createOutputChannel('SACA');

/* ------------------------------ Startup Usage Banner ------------------------------ */

function usageBanner() {
  const os =
    process.platform === 'darwin'
      ? 'macOS'
      : process.platform === 'linux'
      ? 'Linux'
      : process.platform;
  const banner = [
    '=== SACA Extension Activated ===',
    `Platform: ${os}`,
    '',
    'How to use:',
    '  1) Open a source file (C/C++/any text).',
    '  2) Cmd/Ctrl+Shift+P → "SACA: clang-format + ChatGPT Review (Apply changes)".',
    '  3) SACA will:',
    '     - Save & format your file with clang-format (in-place).',
    '     - Run python/python3 to call python/review.py (ChatGPT review).',
    '     - Open a Markdown review.',
    '     - If a full revision is proposed, open a diff and offer:',
    '         • Apply All Changes',
    '         • Select Hunks…',
    '         • Skip',
    '',
    'Requirements:',
    '  • clang-format in PATH (check: "clang-format --version")',
    '  • Python 3.9+ in PATH (python or python3)',
    '  • pip install -r python/requirements.txt',
    '  • OPENAI_API_KEY exported (unless SACA_MOCK=1 for local testing)',
    '',
    'Tips:',
    '  • On macOS/Linux, if PATH differs inside VS Code, launch VS Code from a shell ("code .").',
    '  • For testing without API key: export SACA_MOCK=1',
    '  • Logs: View → Output → choose "SACA" (Cmd/Ctrl+Shift+U).',
    '===============================================================================',
  ].join('\n');
  out.appendLine(banner);
  out.show(true);
}

/* ------------------------------ Utilities ------------------------------ */

function pickPython(): string {
  // Prioritize explicit env, then platform-typical commands
  const candidates = [
    process.env.PYTHON,
    process.platform === 'win32' ? 'py' : undefined,
    'python3',
    'python',
  ].filter(Boolean) as string[];
  const chosen = candidates[0]!;
  out.appendLine(`[env] Selected python launcher candidate: ${chosen}`);
  return chosen;
}

function whichCmd(name: string): Promise<string | null> {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  return new Promise((resolve) => {
    const p = spawn(cmd, [name]);
    let outStr = '';
    p.stdout.on('data', (d) => (outStr += d.toString()));
    p.on('close', (code) => resolve(code === 0 ? outStr.trim().split(/\r?\n/)[0] : null));
    p.on('error', () => resolve(null));
  });
}

/* ------------------------------ clang-format ------------------------------ */

async function runClangFormat(filePath: string): Promise<void> {
  out.appendLine(`[clang-format] Checking availability...`);
  const found = await whichCmd('clang-format');
  if (!found) {
    out.appendLine(`[clang-format] NOT FOUND in PATH`);
    throw new Error(
      'clang-format not found in PATH. Install it and ensure VS Code inherits your PATH (on macOS/Linux, try launching VS Code from a login shell with "code .").'
    );
  }
  out.appendLine(`[clang-format] Found at: ${found}`);
  out.appendLine(`[clang-format] Running on: ${filePath}`);

  return new Promise((resolve, reject) => {
    const args = ['-i', filePath];
    const proc = execFile('clang-format', args, (error, stdout, stderr) => {
      if (stdout) out.appendLine(`[clang-format][stdout]\n${stdout}`);
      if (stderr) out.appendLine(`[clang-format][stderr]\n${stderr}`);
      if (error) {
        out.appendLine(`[clang-format] FAILED: ${error.message}`);
        reject(new Error(`clang-format failed: ${stderr || error.message}`));
        return;
      }
      out.appendLine(`[clang-format] Done.`);
      resolve();
    });

    proc.on('error', (err) => {
      out.appendLine(`[clang-format] SPAWN ERROR: ${err.message}`);
      reject(new Error(`Failed to spawn clang-format: ${err.message}`));
    });
  });
}

/* ------------------------------ review.py JSON call ------------------------------ */

function runPythonJSON(
  pyPath: string,
  filePath: string
): Promise<{ report_markdown: string; revised_code?: string | null }> {
  return new Promise((resolve, reject) => {
    const pythonCmd = pickPython();
    const cwd = path.join(__dirname, '..');
    const env = { ...process.env };

    out.appendLine(`[review.py] Preparing to run`);
    out.appendLine(`  CMD: ${pythonCmd}`);
    out.appendLine(`  SCRIPT: ${pyPath}`);
    out.appendLine(`  FILE: ${filePath}`);
    out.appendLine(`  CWD: ${cwd}`);
    out.appendLine(`  OPENAI_API_KEY set? ${!!env.OPENAI_API_KEY}  |  SACA_MOCK=${env.SACA_MOCK || 'unset'}`);

    const args = [pyPath, filePath, '--json'];
    const proc = spawn(pythonCmd, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });

    let outStr = '';
    let errStr = '';

    proc.on('error', (err) => {
      out.appendLine(`[review.py] SPAWN ERROR: ${err.message}`);
      reject(new Error(`Failed to spawn Python: ${err.message}`));
    });

    proc.stdout.on('data', (d: Buffer) => {
      const s = d.toString();
      outStr += s;
      out.append(`[review.py][stdout] ${s}`);
    });

    proc.stderr.on('data', (d: Buffer) => {
      const s = d.toString();
      errStr += s;
      out.append(`[review.py][stderr] ${s}`);
    });

    proc.on('close', (code) => {
      out.appendLine(`\n[review.py] EXIT CODE: ${code}`);
      if (code !== 0) {
        reject(new Error(`review.py exited with code ${code}\n${errStr}`));
        return;
      }
      try {
        const parsed = JSON.parse(outStr);
        resolve({
          report_markdown: parsed.report_markdown || '',
          revised_code: parsed.revised_code ?? null,
        });
      } catch (e: any) {
        reject(
          new Error(`Failed to parse JSON from review.py: ${e.message}\nRaw output:\n${outStr}`)
        );
      }
    });
  });
}

/* ------------------------------ Diff & Apply UI ------------------------------ */

async function showDiffAndOfferApply(originalDoc: vscode.TextDocument, revised: string) {
  out.appendLine(`[apply] Preparing diff/apply UI...`);

  // Right (proposed) doc is untitled so it won't overwrite disk until applied.
  const rightDoc = await vscode.workspace.openTextDocument({
    language: originalDoc.languageId,
    content: revised,
  });
  const rightUri = rightDoc.uri.with({
    scheme: 'untitled',
    path: (rightDoc.uri.path || originalDoc.uri.path) + '.proposed',
  });

  await vscode.commands.executeCommand('vscode.diff', originalDoc.uri, rightUri, 'Proposed Revision');

  const choice = await vscode.window.showQuickPick(
    [
      { label: 'Apply All Changes', description: 'Replace the whole file with the proposed revision', action: 'all' },
      { label: 'Select Hunks…', description: 'Choose specific changes to apply', action: 'hunks' },
      { label: 'Skip', description: 'Do not apply any changes', action: 'skip' },
    ],
    { placeHolder: 'How would you like to apply ChatGPT suggestions?' }
  );

  if (!choice || choice.action === 'skip') {
    out.appendLine(`[apply] User skipped applying changes.`);
    return;
  }

  const editor = await vscode.window.showTextDocument(originalDoc);
  const originalText = originalDoc.getText();

  if (choice.action === 'all') {
    out.appendLine(`[apply] Applying ALL changes...`);
    await editor.edit((edit) => {
      const start = new vscode.Position(0, 0);
      const end = originalDoc.lineAt(Math.max(0, originalDoc.lineCount - 1)).range.end;
      edit.replace(new vscode.Range(start, end), revised);
    });
    await originalDoc.save();
    vscode.window.showInformationMessage('SACA: Applied all changes.');
    out.appendLine(`[apply] All changes applied and file saved.`);
    return;
  }

  // Select hunks
  out.appendLine(`[apply] Computing hunks...`);
  const changes: Change[] = diffLines(originalText, revised);
  type Hunk = { idx: number; oldStart: number; oldEnd: number; newText: string; preview: string };
  const hunks: Hunk[] = [];

  let oldLine = 0;
  changes.forEach((part: Change, idx: number) => {
    if (!part.added && !part.removed) {
      const lines = part.value.split(/\r?\n/);
      oldLine += lines.length - 1;
      return;
    }

    const prev = changes[idx - 1];
    const next = changes[idx + 1];
    const ctxBefore =
      prev && !prev.added && !prev.removed ? prev.value.split(/\r?\n/).slice(-2).join('\n') : '';
    const ctxAfter =
      next && !next.added && !next.removed ? next.value.split(/\r?\n/).slice(0, 2).join('\n') : '';

    if (part.removed) {
      const removedCount = part.value.split(/\r?\n/).length - 1;
      const oldStart = oldLine;
      const oldEnd = oldLine + removedCount;
      let newText = '';
      if (next && next.added) newText = next.value;

      const preview = [
        ctxBefore && '...\n' + ctxBefore,
        '---',
        part.value.trimEnd(),
        '+++',
        (newText || '').trimEnd(),
        ctxAfter && ctxAfter + '\n...',
      ]
        .filter(Boolean)
        .join('\n');

      hunks.push({ idx, oldStart, oldEnd, newText, preview });
      oldLine = oldEnd;
    } else if (part.added) {
      const newText = part.value;
      const preview = [
        ctxBefore && '...\n' + ctxBefore,
        '+++',
        newText.trimEnd(),
        ctxAfter && ctxAfter + '\n...',
      ]
        .filter(Boolean)
        .join('\n');
      const oldStart = oldLine;
      const oldEnd = oldLine; // pure insertion
      hunks.push({ idx, oldStart, oldEnd, newText, preview });
    }
  });

  if (hunks.length === 0) {
    out.appendLine(`[apply] No differences detected between original and revised.`);
    vscode.window.showInformationMessage('SACA: No differences detected.');
    return;
  }

  out.appendLine(`[apply] ${hunks.length} hunk(s) available.`);
  const picks = await vscode.window.showQuickPick(
    hunks.map((h) => ({ label: `Hunk @${h.oldStart}`, detail: h.preview, picked: true, hunk: h })),
    { canPickMany: true, matchOnDetail: true, placeHolder: 'Select hunks to apply' }
  );
  if (!picks || picks.length === 0) {
    out.appendLine(`[apply] User selected no hunks.`);
    vscode.window.showInformationMessage('SACA: No hunks selected.');
    return;
  }

  const selected = picks.map((p) => p.hunk as Hunk).sort((a, b) => b.oldStart - a.oldStart);
  out.appendLine(`[apply] Applying ${selected.length} selected hunk(s) in reverse order...`);
  await editor.edit((editBuilder) => {
    for (const h of selected) {
      const startPos = new vscode.Position(h.oldStart, 0);
      const endLine = Math.min(h.oldEnd, originalDoc.lineCount - 1);
      const endPos = new vscode.Position(endLine, originalDoc.lineAt(endLine).range.end.character);
      editBuilder.replace(new vscode.Range(startPos, endPos), h.newText);
    }
  });
  await originalDoc.save();
  vscode.window.showInformationMessage(`SACA: Applied ${selected.length} hunk(s).`);
  out.appendLine(`[apply] Done. Saved file.`);
}

/* ------------------------------ Activate / Deactivate ------------------------------ */

export function activate(context: vscode.ExtensionContext) {
  usageBanner(); // prints usage + shows Output panel

  out.appendLine(`[env] OPENAI_API_KEY set? ${!!process.env.OPENAI_API_KEY}`);
  out.appendLine(`[env] SACA_MOCK: ${process.env.SACA_MOCK || 'unset'}`);

  const disposable = vscode.commands.registerCommand('saca.formatAndRevise', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor.');
      out.appendLine(`[entry] Aborted: No active editor`);
      return;
    }
    const doc = editor.document;
    if (doc.isUntitled) {
      vscode.window.showErrorMessage('Please save the file before running SACA.');
      out.appendLine(`[entry] Aborted: Document is untitled`);
      return;
    }

    try {
      await doc.save();
      out.appendLine(`[entry] File: ${doc.fileName}`);
      await runClangFormat(doc.fileName);
      out.appendLine(`[entry] clang-format complete.`);

      const pyPath = path.join(context.extensionPath, 'python', 'review.py');
      if (!fs.existsSync(pyPath)) {
        const msg = 'review.py not found. Did you copy the python folder?';
        out.appendLine(`[entry] ${msg}`);
        vscode.window.showErrorMessage(msg);
        return;
      }

      out.appendLine(`[entry] Located review.py at: ${pyPath}`);
      out.appendLine(`[entry] Invoking review.py for ${doc.fileName}...`);
      const res = await runPythonJSON(pyPath, doc.fileName);

      if (res.report_markdown) {
        out.appendLine(`[entry] Showing review markdown...`);
        const reviewDoc = await vscode.workspace.openTextDocument({
          language: 'markdown',
          content: res.report_markdown,
        });
        await vscode.window.showTextDocument(reviewDoc, { preview: false });
      }

      if (res.revised_code && typeof res.revised_code === 'string') {
        out.appendLine(`[entry] Revised code received. Opening diff & apply UI...`);
        await showDiffAndOfferApply(doc, res.revised_code);
      } else {
        out.appendLine(`[entry] No revised code returned (review only).`);
        vscode.window.showInformationMessage('SACA: No revised code returned. Review only.');
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      out.appendLine(`[ERROR] ${msg}\n${e?.stack || ''}`);
      vscode.window.showErrorMessage(`SACA error: ${msg}`);
    } finally {
      out.show(true);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {
  out.appendLine('=== SACA Extension Deactivated ===');
}
