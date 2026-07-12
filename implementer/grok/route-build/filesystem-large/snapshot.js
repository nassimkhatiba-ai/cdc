// fs-snapshot — bounded data-layout snapshot for direct-fs CDC skills.
//
// DEPENDENCY-FREE (node builtins only): this file is copied verbatim into
// generated skills as snapshot.js, so `node q.js recon` can rebuild the same
// view at use time if the layout drifted.
//
// Why this exists: the two live failure modes of "agent writes a data script"
// were (a) aggregating a full dump PLUS its page shards (2× results), and
// (b) filtering on guessed field names/values (silent 0). Both are layout
// knowledge. Capturing it once at skill-build time removes the recon turn
// AND the guessing.
const fs = require('fs');
const path = require('path');

const DATA_EXT = new Set(['.json', '.ndjson', '.csv', '.tsv']);
const SKIP = new Set(['node_modules', '.git', '.DS_Store']);
const MAX_PARSE_BYTES = 20 * 1024 * 1024;
const MAX_FAMILY_PARSE = 80; // max shard files to count records across

function human(bytes) {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + 'MB';
  if (bytes >= 1024) return Math.round(bytes / 1024) + 'KB';
  return bytes + 'B';
}

/** page_000.json / note-17.txt -> collapse numeric runs so files group into families */
function familyKey(name) {
  return name.replace(/\d+/g, '#');
}

function loadRows(p, size) {
  if (size > MAX_PARSE_BYTES) return null;
  const ext = path.extname(p).toLowerCase();
  if (!DATA_EXT.has(ext)) return null;
  let raw;
  try { raw = fs.readFileSync(p, 'utf8'); } catch { return null; }
  try {
    if (ext === '.json') {
      const j = JSON.parse(raw);
      if (Array.isArray(j)) return { rows: j };
      if (j && typeof j === 'object') {
        const arrays = Object.entries(j).filter(([, v]) => Array.isArray(v));
        if (arrays.length === 1) return { rows: arrays[0][1], wrapper: arrays[0][0] };
        return { obj: Object.keys(j).slice(0, 12) };
      }
      return null;
    }
    if (ext === '.ndjson') {
      return { rows: raw.split('\n').filter(Boolean).map((l) => JSON.parse(l)) };
    }
    // csv/tsv: header + row count only
    const lines = raw.split(/\r?\n/).filter(Boolean);
    return { csvHeader: lines[0]?.slice(0, 160), csvRows: Math.max(0, lines.length - 1) };
  } catch { return null; }
}

/** field list with types; short string enums inlined — these enums are what
 *  stop agents from filtering on values that don't exist. */
function fieldsOf(rows) {
  const first = rows.find((r) => r && typeof r === 'object' && !Array.isArray(r));
  if (!first) return { fields: [], fieldSet: '' };
  const keys = Object.keys(first).slice(0, 12);
  const sample = rows.slice(0, 300);
  const fields = keys.map((k) => {
    const vals = [];
    for (const r of sample) if (r && r[k] !== undefined && r[k] !== null) vals.push(r[k]);
    const v0 = vals[0];
    if (typeof v0 === 'number') return `${k}:num`;
    if (typeof v0 === 'boolean') return `${k}:bool`;
    if (Array.isArray(v0)) return `${k}:[]`;
    if (typeof v0 === 'object') return `${k}:{}`;
    if (typeof v0 === 'string') {
      const distinct = [...new Set(vals)];
      if (distinct.length <= 8 && distinct.every((s) => String(s).length <= 20)) {
        return `${k}:(${distinct.sort().join('|')})`;
      }
      return `${k}:str`;
    }
    return k;
  });
  return { fields, fieldSet: keys.join(',') };
}

function snapshotFs(root, { maxDepth = 3, maxLines = 60 } = {}) {
  if (!root || !fs.existsSync(root)) return { ok: false, lines: [] };
  const lines = [];

  function walk(dir, rel, depth) {
    if (depth > maxDepth || lines.length >= maxLines) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    entries = entries.filter((e) => !SKIP.has(e.name) && !e.name.startsWith('.'));

    const dirs = entries.filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
    const files = entries.filter((e) => e.isFile()).sort((a, b) => a.name.localeCompare(b.name));

    // group files into numeric families
    const families = new Map();
    for (const f of files) {
      const key = familyKey(f.name);
      if (!families.has(key)) families.set(key, []);
      families.get(key).push(f.name);
    }

    // analyze singles first so families can be checked against them for duplication
    const singles = []; // { name, n, fieldSet, line }
    const fams = [];
    for (const [key, names] of families) {
      if (names.length >= 3) fams.push({ key, names });
      else for (const name of names) singles.push(name);
    }

    const singleInfo = [];
    for (const name of singles) {
      if (lines.length >= maxLines) return;
      const p = path.join(dir, name);
      const relPath = rel ? `${rel}/${name}` : name;
      let size = 0;
      try { size = fs.statSync(p).size; } catch {}
      const data = loadRows(p, size);
      if (data?.rows) {
        const { fields, fieldSet } = fieldsOf(data.rows);
        const wrap = data.wrapper ? ` (under key "${data.wrapper}")` : '';
        lines.push(`${relPath} — ${data.rows.length} records${wrap}: ${fields.join(', ')}`);
        singleInfo.push({ name, n: data.rows.length, fieldSet });
      } else if (data?.csvHeader !== undefined) {
        lines.push(`${relPath} — csv, ${data.csvRows} rows: ${data.csvHeader}`);
      } else if (data?.obj) {
        lines.push(`${relPath} — object: {${data.obj.join(',')}}`);
      } else {
        lines.push(`${relPath} — ${human(size)}`);
      }
    }

    for (const { names } of fams) {
      if (lines.length >= maxLines) return;
      const first = names[0], last = names[names.length - 1];
      const display = rel ? `${rel}/` : '';
      const firstPath = path.join(dir, first);
      let size = 0;
      try { size = fs.statSync(firstPath).size; } catch {}
      const ext = path.extname(first).toLowerCase();

      if (DATA_EXT.has(ext) && names.length <= MAX_FAMILY_PARSE) {
        let total = 0;
        let rep = null;
        for (const n of names) {
          const d = loadRows(path.join(dir, n), size * 2);
          if (d?.rows) { total += d.rows.length; rep = rep || d.rows; }
        }
        const { fields, fieldSet } = rep ? fieldsOf(rep) : { fields: [], fieldSet: '' };
        let line = `${display}${first} … ${last} (${names.length} files) — ${total} records total: ${fields.join(', ')}`;
        const dup = singleInfo.find((s) => s.n === total && s.fieldSet === fieldSet);
        if (dup) {
          line += `\n  ⚠ DUPLICATE of ${display}${dup.name} — same records split into pages. Use ONE source, NEVER both.`;
        }
        lines.push(line);
      } else {
        lines.push(`${display}${first} … ${last} (${names.length} files, ~${human(size)} each)`);
      }
    }

    for (const d of dirs) {
      if (lines.length >= maxLines) return;
      const relPath = rel ? `${rel}/${d.name}` : d.name;
      lines.push(`${relPath}/`);
      walk(path.join(dir, d.name), relPath, depth + 1);
    }
  }

  walk(root, '', 0);
  if (lines.length >= maxLines) lines.push('… (truncated)');
  const block = lines.join('\n');
  return {
    ok: true,
    lines,
    skillBlock: lines.slice(0, 22).join('\n') + (lines.length > 22 ? '\n… (more in CDC.md)' : ''),
    cdcBlock: block,
  };
}

module.exports = { snapshotFs };

if (require.main === module) {
  const root = process.argv[2] || process.env.CDC_FS_ROOT || process.cwd();
  const s = snapshotFs(root);
  console.log(s.ok ? s.cdcBlock : `root not found: ${root}`);
}
