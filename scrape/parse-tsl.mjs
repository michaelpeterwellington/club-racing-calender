// Parse TSL Timing result PDFs into structured rows.
//
// TSL publish results only as PDFs, so `pdftotext -layout` is the way in, but
// there is no single layout to code against. Across four clubs there are at
// least three column orders:
//
//   POS NO CL PIC NAME ENTRY LAPS TIME GAP DIFF MPH BEST ON GRD ^v   (race)
//   POS NO CL PIC NAME ENTRY TIME ON LAPS GAP DIFF MPH               (practice)
//   POS NO NAME MPH                                                  (speed trap)
//
// and CL, PIC, ENTRY and the trailing columns each appear only sometimes. So
// the header line is read as the schema and the row is mapped onto it, rather
// than any order being assumed.
//
// Two further things break naive parsing, both present in real results:
//   - the leader's row has no GAP or DIFF, so columns cannot be counted from
//     the left, and a truncated row loses trailing columns, so they cannot be
//     counted from the right either;
//   - long sponsor names in ENTRY wrap, pushing a row's numbers onto the next
//     line, sometimes jammed against the time ("8:53.201GP Camp").
//
// Candidate column mappings are therefore tried in order and type-checked, so
// the one that actually fits the values wins.
import { execFileSync } from 'node:child_process';

export const pdfToText = (file) =>
  execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8', maxBuffer: 256 << 20 });

const KNOWN = ['POS', 'NO', 'CL', 'PIC', 'NAME', 'ENTRY', 'LAPS', 'TIME', 'GAP', 'DIFF', 'MPH', 'BEST', 'ON', 'GRD'];
const isTime = (t) => /^\d{1,2}:\d{2}\.\d{2,3}$/.test(t) || /^\d{1,3}\.\d{2,3}$/.test(t);
const isGapV = (t) => isTime(t) || /^\d+Lap$/.test(t);
const TYPE = {
  LAPS: (t) => /^\d{1,3}$/.test(t),
  TIME: isTime,
  GAP: isGapV,
  DIFF: isGapV,
  MPH: (t) => /^\d{1,3}\.\d{1,2}$/.test(t),
  BEST: isTime,
  ON: (t) => /^\d{1,3}$/.test(t),
  GRD: (t) => /^\d{1,3}$/.test(t),
  ARROW: (t) => /^-?\d{1,3}$/.test(t),
};

const isHeader = (l) => /\bPOS\b/.test(l) && /\bNO\b/.test(l) && (/\bNAME\b/.test(l) || /\bMPH\b/.test(l));

// Read the header line as an ordered schema with character offsets.
function schema(header) {
  const cols = [];
  for (const name of KNOWN) {
    const m = header.match(new RegExp(`(?<=\\s|^)${name}(?=\\s|$)`));
    if (m) cols.push({ name, at: m.index });
  }
  cols.sort((a, b) => a.at - b.at);
  // the positions-gained column is an arrow glyph, not a word
  const arrow = header.search(/[↑↓]/);
  if (arrow > -1) cols.push({ name: 'ARROW', at: arrow });
  return cols;
}

// "1 Lap" / "2 Laps" is one value, not two tokens.
const tokens = (s) =>
  s.replace(/(\d+)\s+Laps?\b/g, '$1Lap')
   .split(/\s+/)
   .filter((t) => /^-?[\d:.]+$/.test(t) || /^\d+Lap$/.test(t));

// Fit the observed tokens to the declared tail columns. GAP and DIFF are a pair
// absent for the leader; trailing columns go missing on a truncated row. Try
// the plausible shapes in order and take the first that type-checks.
function fitTail(decl, vals) {
  const out = {};
  for (let cut = 0; cut <= 3; cut++) {
    for (const drop of [false, true]) {
      let cand = drop ? decl.filter((c) => c !== 'GAP' && c !== 'DIFF') : decl.slice();
      cand = cand.slice(0, cand.length - cut);
      if (cand.length !== vals.length) continue;
      if (!cand.every((c, i) => !TYPE[c] || TYPE[c](vals[i]))) continue;
      cand.forEach((c, i) => { out[c] = vals[i]; });
      return out;
    }
  }
  return null;
}

export function parseAll(text) {
  const lines = text.split('\n');
  const heads = lines.map((l, i) => (isHeader(l) ? i : -1)).filter((i) => i >= 0);
  const looksLikeRow = (l) => /^\s*\d+\s+\d+\s/.test(l);
  const out = heads.map((hi, n) => {
    let from = hi;
    for (let k = hi - 1; k >= 0 && hi - k <= 14; k--) { if (looksLikeRow(lines[k])) break; from = k; }
    const end = n + 1 < heads.length ? heads[n + 1] : lines.length;
    return parseSection(lines, hi, end, from);
  }).filter((r) => r && r.rows.length);

  // A long classification runs over several pages, each repeating the header.
  const merged = [];
  for (const sec of out) {
    const prev = merged[merged.length - 1];
    if (prev && prev.className === sec.className && prev.session === sec.session) prev.rows.push(...sec.rows);
    else merged.push(sec);
  }
  return merged;
}

export function parseResult(text) {
  const lines = text.split('\n');
  const hi = lines.findIndex(isHeader);
  return hi < 0 ? null : parseSection(lines, hi, lines.length, 0);
}

function parseSection(lines, hi, end, metaFrom = 0) {
  const header = lines[hi];
  const cols = schema(header);
  const at = (n) => cols.find((c) => c.name === n)?.at ?? -1;
  const nameAt = at('NAME'), entryAt = at('ENTRY');
  if (nameAt < 0) return null;
  const headCols = cols.filter((c) => ['POS', 'NO', 'CL', 'PIC'].includes(c.name)).map((c) => c.name);
  const tailCols = cols.filter((c) => !['POS', 'NO', 'CL', 'PIC', 'NAME', 'ENTRY'].includes(c.name)).map((c) => c.name);

  const pre = lines.slice(metaFrom, hi).map((l) => l.trim()).filter(Boolean);
  const sessionLine = pre.find((l) => /CLASSIFICATION|QUALIFYING|^GRID|SPEED/i.test(l)) ?? '';
  const meta = {
    meeting: pre.find((l) => /@/.test(l)) ?? pre[0] ?? '',
    className: (() => {
      const junk = /^Date:|Race Distance|^Page\b|Timing & Results|tsl-timing|^Round\b|^\d|^Weather\s*\/|^Clerk Of Course|^Timekeeper|provisional until|^Results can be found|miles$/i;
      const cand = pre.filter((l) => l !== sessionLine && /[A-Za-z]{3}/.test(l) && !junk.test(l)).pop() ?? '';
      // Some books label the class as "CLASS : Classic ERA - CE"
      const m = cand.match(/^CLASS\s*:\s*(.+?)(?:\s*-\s*[A-Z0-9]{1,4})?$/i);
      return (m ? m[1] : cand).trim();
    })(),
    session: sessionLine.trim(),
    distance: (pre.find((l) => /Race Distance/i.test(l)) ?? '').replace(/.*Race Distance:\s*/i, '').trim() || null,
  };

  const rows = [];
  for (let i = hi + 1; i < end; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const head = line.slice(0, nameAt).trim().split(/\s+/).filter(Boolean);
    if (!head.length || !/^\d+$/.test(head[0])) continue;
    // Race numbers are numeric. The fastest-lap summary table at the foot of a
    // result sheet leads with number then class code, so this rejects it.
    if (head.length > 1 && !/^\d+$/.test(head[1])) continue;

    const cont = lines[i + 1] && !/^\s*\d+\s/.test(lines[i + 1].slice(0, nameAt)) ? lines[i + 1] : '';

    const h = {};
    if (headCols.length === head.length) headCols.forEach((c, k) => { h[c] = head[k]; });
    else {
      h.POS = head[0]; h.NO = head[1];
      const rest = head.slice(2);
      h.CL = rest.find((t) => !/^-?\d+$/.test(t)) ?? null;
      const ns = rest.filter((t) => /^\d+$/.test(t));
      h.PIC = ns.length ? ns[ns.length - 1] : null;
    }

    const nameEnd = entryAt > -1 ? entryAt : line.length;
    const name = line.slice(nameAt, nameEnd).replace(/\s+/g, ' ').trim();

    let entry = '', vals;
    if (entryAt > -1) {
      const after = line.slice(entryAt);
      // The first declared tail column marks where ENTRY stops. Anchor on its
      // value so a wrapped sponsor name can't swallow the numbers.
      const firstTail = tailCols[0];
      const re = firstTail === 'LAPS' ? /(?:^|\s)(\d{1,3})\s+(\d{1,2}:\d{2}\.\d{2,3}|\d{1,3}\.\d{2,3})/
                                      : /(?:^|\s)(\d{1,2}:\d{2}\.\d{2,3}|\d{1,3}\.\d{2,3})(?:\s|$)/;
      const m = after.match(re);
      if (!m) continue;
      entry = after.slice(0, m.index);
      if (cont) entry += ' ' + cont.slice(entryAt).replace(re, '');
      vals = tokens(after.slice(m.index));
      if (cont) vals = vals.concat(tokens(cont.slice(entryAt)).filter((t) => !entry.includes(t)));
    } else {
      vals = tokens(line.slice(nameAt + name.length));
    }

    const t = fitTail(tailCols, vals);
    if (!t) continue;

    entry = entry.replace(/\s+/g, ' ').trim();
    const em = entry.match(/^(.*?)\s+-\s*(.*)$/);
    const bike = (em ? em[1] : entry).trim() || null;
    const team = (em ? em[2] : '').replace(/[^\w\s&/'.()-]+$/, '').trim() || null;
    const unlap = (v) => (v && /Lap$/.test(v) ? v.replace(/Lap$/, ' lap') : v);
    const num = (v) => (v != null && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : null);

    rows.push({
      pos: Number(h.POS), number: h.NO ?? null, classCode: h.CL ?? null,
      posInClass: num(h.PIC), name, bike, team,
      laps: num(t.LAPS), time: t.TIME ?? null,
      gap: unlap(t.GAP ?? null), diff: unlap(t.DIFF ?? null),
      mph: num(t.MPH), best: t.BEST ?? t.TIME ?? null,
      bestOnLap: num(t.ON), grid: num(t.GRD), gained: num(t.ARROW),
    });
  }
  return { ...meta, rows };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const text = pdfToText(process.argv[2]);
  console.log(JSON.stringify(process.argv.includes('--book') ? parseAll(text) : parseResult(text), null, 2));
}
