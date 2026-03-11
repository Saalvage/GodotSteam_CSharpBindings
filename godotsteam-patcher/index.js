/*
  godotsteam-patcher
  Applies small, robust patches to the auto-generated Steam.cs
*/

const fs = require("fs");
const path = require("path");

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

function detectNewline(text) {
  const crlf = (text.match(/\r\n/g) || []).length;
  const lf = (text.match(/(?<!\r)\n/g) || []).length;
  return crlf >= lf ? "\r\n" : "\n";
}

function splitLines(text) {
  return text.split(/\r?\n/);
}

function normalizeWhitespace(s) {
  return s.replace(/\s+/g, " ").trim();
}

function buildFlags(op) {
  let flags = op.caseInsensitive ? "i" : "";
  // Always allow multiline when using replaceText over whole file
  if (op.multiline) flags += flags.includes("m") ? "" : "m";
  return flags;
}

function matchLine(line, pattern, options = {}) {
  const { useRegex, caseInsensitive, normalize = true } = options;
  let l = line;
  if (normalize) l = normalizeWhitespace(l);
  if (useRegex) {
    const re = new RegExp(pattern, caseInsensitive ? "i" : "");
    return re.test(l);
  } else {
    const p = normalize ? normalizeWhitespace(String(pattern)) : String(pattern);
    return caseInsensitive ? l.toLowerCase().includes(p.toLowerCase()) : l.includes(p);
  }
}

function findLineIndex(lines, pattern, options = {}) {
  const { startIndex = 0, occurrence = 1 } = options;
  let count = 0;
  for (let i = startIndex; i < lines.length; i++) {
    if (matchLine(lines[i], pattern, options)) {
      count++;
      if (count === occurrence) return i;
    }
  }
  return -1;
}

function ensureArrayOfLines(code) {
  if (Array.isArray(code)) return code.flatMap(l => String(l).split(/\r?\n/));
  return String(code).split(/\r?\n/);
}

function applyOperation(op, state) {
  const { newline } = state;
  let changed = false;

  switch (op.op) {
    case "replaceText": {
      const re = op.useRegex
        ? new RegExp(op.pattern, buildFlags({ caseInsensitive: op.caseInsensitive, multiline: true }))
        : null;
      const current = state.lines.join(newline);
      const already = op.skipIfPresent && current.includes(op.replacement);
      if (already) return { changed: false, message: `replaceText skipped (already present): ${op.id || op.pattern}` };
      let next;
      if (op.useRegex) {
        next = current.replace(re, op.replacement);
      } else {
        const from = op.caseInsensitive ? new RegExp(op.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi") : op.pattern;
        next = current.replace(from, op.replacement);
      }
      if (next !== current) {
        state.lines = splitLines(next);
        changed = true;
      }
      return { changed, message: `replaceText ${changed ? "applied" : "no-op (not found)"}: ${op.id || op.pattern}` };
    }

    case "replaceLine": {
      const idx = findLineIndex(state.lines, op.pattern, { useRegex: op.useRegex, caseInsensitive: op.caseInsensitive, normalize: op.normalizeWhitespace !== false, occurrence: op.occurrence || 1 });
      if (idx === -1) return { changed: false, message: `replaceLine not found: ${op.id || op.pattern}` };
      if (op.skipIfPresent && state.lines[idx] === op.code) return { changed: false, message: `replaceLine skipped (already same): ${op.id || op.pattern}` };
      const newLines = ensureArrayOfLines(op.code);
      state.lines.splice(idx, 1, ...newLines);
      changed = true;
      return { changed, message: `replaceLine applied: ${op.id || op.pattern}` };
    }

    case "insertBefore":
    case "insertAfter": {
      const idx = findLineIndex(state.lines, op.pattern, { useRegex: op.useRegex, caseInsensitive: op.caseInsensitive, normalize: op.normalizeWhitespace !== false, occurrence: op.occurrence || 1 });
      if (idx === -1) return { changed: false, message: `${op.op} anchor not found: ${op.id || op.pattern}` };
      const insertion = ensureArrayOfLines(op.code);
      const fileText = state.lines.join(newline);
      if (op.skipIfPresent && insertion.every(l => l.length === 0 || fileText.includes(l))) {
        return { changed: false, message: `${op.op} skipped (already present): ${op.id || op.pattern}` };
      }
      const at = op.op === "insertBefore" ? idx : idx + 1;
      state.lines.splice(at, 0, ...insertion);
      changed = true;
      return { changed, message: `${op.op} applied: ${op.id || op.pattern}` };
    }

    case "replaceBetween": {
      const startIdx = findLineIndex(state.lines, op.start, { useRegex: op.useRegex, caseInsensitive: op.caseInsensitive, normalize: op.normalizeWhitespace !== false, occurrence: op.startOccurrence || 1 });
      if (startIdx === -1) return { changed: false, message: `replaceBetween start not found: ${op.id || op.start}` };
      const from = op.includeStart ? startIdx : startIdx + 1;
      const endIdx = findLineIndex(state.lines, op.end, { useRegex: op.useRegex, caseInsensitive: op.caseInsensitive, normalize: op.normalizeWhitespace !== false, startIndex: from, occurrence: op.endOccurrence || 1 });
      if (endIdx === -1) return { changed: false, message: `replaceBetween end not found: ${op.id || op.end}` };
      const to = op.includeEnd ? endIdx + 1 : endIdx;
      const replacement = ensureArrayOfLines(op.code);
      state.lines.splice(from, to - from, ...replacement);
      changed = true;
      return { changed, message: `replaceBetween applied: ${op.id || `${op.start}…${op.end}`}` };
    }

    default:
      return { changed: false, message: `Unknown op: ${op.op}` };
  }
}

function main() {
  const root = path.resolve(__dirname, "..");
  const steamPath = path.resolve(root, "gluecode-project", "addons", "godotsteam_csharpbindings", "Steam.cs");

  console.log("Loading Steam.cs");
  if (!fs.existsSync(steamPath)) {
    console.error("Steam.cs not found:", steamPath);
    process.exitCode = 1;
    return;
  }
  const originalText = readText(steamPath);
  const newline = detectNewline(originalText);
  const state = { lines: splitLines(originalText), newline };

  console.log("Loading patches");
  const patchesDir = path.resolve(__dirname, "patches");
  let patchFiles = [];
  if (fs.existsSync(patchesDir)) {
    patchFiles = fs.readdirSync(patchesDir).filter(f => f.toLowerCase().endsWith(".json")).sort();
  }
  const allOps = [];
  for (const file of patchFiles) {
    const fp = path.join(patchesDir, file);
    try {
      const data = JSON.parse(readText(fp));
      const ops = Array.isArray(data) ? data : (data.operations || []);
      ops.forEach(op => { if (!op.id) op.id = data.id || file; });
      allOps.push(...ops);
      console.log(`Loaded ${ops.length} ops from ${file}`);
    } catch (e) {
      console.error(`Failed to load patch file ${file}:`, e.message);
    }
  }

  console.log("Patching Steam.cs");
  let changes = 0;
  for (const op of allOps) {
    const res = applyOperation(op, state);
    if (res.changed) changes++;
    console.log(" -", res.message);
  }

  console.log("Saving new Steam.cs");
  const nextText = state.lines.join(newline);
  if (nextText !== originalText) {
    writeText(steamPath, nextText);
    console.log(`Saved. ${changes} change(s) applied.`);
  } else {
    console.log("No changes were necessary.");
  }

  console.log("Done!");
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e); process.exitCode = 1; }
}
