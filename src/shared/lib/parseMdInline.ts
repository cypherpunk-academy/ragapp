export type MdSeg = { text: string; bold?: true; italic?: true; underline?: true };

/** Parse `**bold**`, `_underline_`, and `*italic*` markers into styled segments. */
export function parseMdInline(src: string): MdSeg[] {
  const re = /\*\*(.+?)\*\*|_(.+?)_|\*(.+?)\*/gs;
  const segs: MdSeg[] = [];
  let last = 0;
  for (const m of src.matchAll(re)) {
    if (m.index! > last) segs.push({ text: src.slice(last, m.index) });
    if (m[1] !== undefined) segs.push({ text: m[1], bold: true });
    else if (m[2] !== undefined) segs.push({ text: m[2], underline: true });
    else segs.push({ text: m[3]!, italic: true });
    last = m.index! + m[0].length;
  }
  if (last < src.length) segs.push({ text: src.slice(last) });
  return segs;
}
