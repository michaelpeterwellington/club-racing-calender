// Parse a TSL Timing result PDF into structured rows.
//
// TSL publish results only as PDFs, so `pdftotext -layout` is the way in. Three
// things make naive parsing fail, all of them present in real BMCRC results:
//   1. Three-digit race numbers overflow leftward into the POS column.
//   2. The leader's row has no GAP or DIFF, so columns can't be counted L-to-R.
//   3. Long sponsor names in ENTRY wrap, pushing that row's numbers onto the
//      next line, sometimes jammed against the time ("8:53.201GP Camp").
// So: the left fields come from the header's column offsets (they're
// left-aligned and stable), LAPS/TIME are found by pattern, and everything
// after is assigned RIGHT-to-left, which is the only stable anchor.
import { execFileSync } from 'node:child_process';

const TIME = /^\d{1,2}:\d{2}\.\d{2,3}$|^\d{1,3}\.\d{2,3}$/;
const LAPTIME = /(?:^|\s)(\d{1,3})\s+(\d{1,2}:\d{2}\.\d{2,3})/;

export const pdfToText = (file) =>
  execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 });

function columnStart(header, name) {
  const m = header.match(new RegExp(`(?<=\\s|^)${name}(?=\\s|$)`));
  return m ? m.index : -1;
}

// "1 Lap" / "2 Laps" are one value, not two tokens.
const tailTokens = (s) =>
  s.replace(/(\d+)\s+Laps?\b/g, '$1Lap')
   .split(/\s+/)
   .filter((t) => /^-?[\d:.]+$/.test(t) || /^\d+Lap$/.test(t));

export function parseResult(text) {
  const lines = text.split('\n');
  const hi = lines.findIndex((l) => /\bPOS\b/.test(l) && /\bNAME\b/.test(l) && /\bLAPS\b/.test(l));
  if (hi < 0) return null;

  const header = lines[hi];
  const nameAt = columnStart(header, 'NAME');
  const entryAt = columnStart(header, 'ENTRY');
  if (nameAt < 0 || entryAt < 0) return null;

  const pre = lines.slice(0, hi).map((l) => l.trim()).filter(Boolean);
  const meta = {
    meeting: pre[0] ?? '',
    className: pre[1] ?? '',
    session: (pre.find((l) => /CLASSIFICATION|QUALIFYING|GRID/i.test(l)) ?? '').trim(),
    distance: (pre.find((l) => /Race Distance/i.test(l)) ?? '').replace(/.*Race Distance:\s*/i, '').trim() || null,
  };

  const rows = [];
  for (let i = hi + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const head = line.slice(0, nameAt).trim().split(/\s+/).filter(Boolean);
    if (!head.length || !/^\d+$/.test(head[0])) continue;   // footer or wrapped line

    const cont = lines[i + 1] && !/^\s*\d+\s/.test(lines[i + 1].slice(0, nameAt)) ? lines[i + 1] : '';

    // POS NO [CL] [PIC] — class code is the non-numeric one, PIC the trailing number
    const [pos, number, ...rest] = head;
    const classCode = rest.find((t) => !/^-?\d+$/.test(t)) ?? null;
    const nums = rest.filter((t) => /^\d+$/.test(t));
    const posInClass = nums.length ? Number(nums.at(-1)) : null;

    const name = line.slice(nameAt, entryAt).replace(/\s+/g, ' ').trim();
    const after = line.slice(entryAt);
    const m = after.match(LAPTIME);
    if (!m) continue;

    let entry = after.slice(0, m.index);
    if (cont) entry += ' ' + cont.slice(entryAt).replace(/(?:^|\s)\d{1,3}\s+\d{1,2}:\d{2}\.\d{2,3}.*$/, '');
    entry = entry.replace(/\s+/g, ' ').trim();
    // ENTRY is "<bike> - <team/sponsor>"; the team half is often empty, leaving
    // a trailing dash, so split on the first dash rather than on ' - '.
    const em = entry.match(/^(.*?)\s+-\s*(.*)$/);
    const bike = (em ? em[1] : entry).trim() || null;
    const team = (em ? em[2] : '').replace(/[^\w\s&/'.()-]+$/, '').trim() || null;

    // Right-anchored tail: ... [GAP DIFF] MPH BEST ON GRD [+/-]
    let tail = tailTokens(after.slice(m.index + m[0].length));
    if (cont) tail = tail.concat(tailTokens(cont.slice(entryAt)));
    // Columns are [GAP DIFF] MPH BEST ON GRD [+/-], but GAP/DIFF are absent for
    // the leader and the trailing columns are sometimes missing on a truncated
    // row, so counting from either end is unreliable. Anchor on the one
    // unambiguous signature instead: MPH (1-2 decimals) immediately followed by
    // BEST (a lap time, 3 decimals). Gaps also carry 3 decimals, so it is the
    // adjacency that identifies them, not the shape of either alone.
    const isMph = (t) => /^\d{1,3}\.\d{1,2}$/.test(t);
    const isLap = (t) => /^\d{1,2}:\d{2}\.\d{3}$/.test(t) || /^\d{1,3}\.\d{3}$/.test(t);
    let at = -1;
    for (let k = tail.length - 1; k >= 1; k--) if (isLap(tail[k]) && isMph(tail[k - 1])) { at = k; break; }
    const mph = at > 0 ? tail[at - 1] : null;
    const best = at > 0 ? tail[at] : null;
    const trailing = at > 0 ? tail.slice(at + 1) : [];
    const [onLap = null, grid = null, delta = null] = trailing;
    const before = at > 0 ? tail.slice(0, at - 1) : tail;
    const [gap = null, diff = null] = before.length >= 2 ? before.slice(-2) : [];
    const unlap = (v) => (v && /Lap$/.test(v) ? v.replace(/Lap$/, ' lap') : v);

    rows.push({
      pos: Number(pos), number, classCode, posInClass, name,
      bike, team,
      laps: Number(m[1]), time: m[2],
      gap: unlap(gap), diff: unlap(diff),
      mph: mph && /^\d+\.\d+$/.test(mph) ? Number(mph) : null,
      best: best && TIME.test(best) ? best : null,
      bestOnLap: onLap && /^\d+$/.test(onLap) ? Number(onLap) : null,
      grid: grid && /^\d+$/.test(grid) ? Number(grid) : null,
      gained: delta && /^-?\d+$/.test(delta) ? Number(delta) : null,
    });
  }
  return { ...meta, rows };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(parseResult(pdfToText(process.argv[2])), null, 2));
}
