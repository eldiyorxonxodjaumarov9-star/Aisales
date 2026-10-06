export type ExportFormat = 'csv' | 'xlsx' | 'pdf'
export type Cell = string | number
export interface Table {
  title: string
  columns: string[]
  rows: Cell[][]
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function toCsv(t: Table): string {
  const esc = (v: Cell) => {
    const s = String(v)
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [t.columns, ...t.rows].map((r) => r.map(esc).join(',')).join('\r\n')
}

/* ---------- XLSX (Office Open XML in an uncompressed ZIP) ---------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(data: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function zip(files: { name: string; data: string }[]): Uint8Array {
  const enc = new TextEncoder()
  const chunks: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  for (const f of files) {
    const name = enc.encode(f.name)
    const data = enc.encode(f.data)
    const crc = crc32(data)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(6, 0x0800, true)
    local.setUint16(8, 0, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, data.length, true)
    local.setUint32(22, data.length, true)
    local.setUint16(26, name.length, true)
    chunks.push(new Uint8Array(local.buffer), name, data)

    const cen = new DataView(new ArrayBuffer(46))
    cen.setUint32(0, 0x02014b50, true)
    cen.setUint16(4, 20, true)
    cen.setUint16(6, 20, true)
    cen.setUint16(8, 0x0800, true)
    cen.setUint32(16, crc, true)
    cen.setUint32(20, data.length, true)
    cen.setUint32(24, data.length, true)
    cen.setUint16(28, name.length, true)
    cen.setUint32(42, offset, true)
    central.push(new Uint8Array(cen.buffer), name)
    offset += 30 + name.length + data.length
  }
  const cenSize = central.reduce((a, c) => a + c.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, files.length, true)
  end.setUint16(10, files.length, true)
  end.setUint32(12, cenSize, true)
  end.setUint32(16, offset, true)
  const all = [...chunks, ...central, new Uint8Array(end.buffer)]
  const out = new Uint8Array(all.reduce((a, c) => a + c.length, 0))
  let p = 0
  for (const c of all) {
    out.set(c, p)
    p += c.length
  }
  return out
}

const xmlEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function colName(i: number): string {
  let s = ''
  let n = i + 1
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

export function toXlsx(t: Table): Uint8Array {
  const row = (cells: Cell[], r: number, header: boolean) =>
    `<row r="${r}">${cells
      .map((v, i) => {
        const ref = `${colName(i)}${r}`
        const style = header ? ' s="1"' : ''
        return typeof v === 'number'
          ? `<c r="${ref}"${style}><v>${v}</v></c>`
          : `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`
      })
      .join('')}</row>`
  const cols = t.columns.map((c, i) => {
    const w = Math.min(48, Math.max(c.length, ...t.rows.map((r) => String(r[i] ?? '').length)) + 3)
    return `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`
  })
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${cols.join('')}</cols><sheetData>${row(t.columns, 1, true)}${t.rows.map((r, i) => row(r, i + 2, false)).join('')}</sheetData></worksheet>`
  return zip([
    {
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      name: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEsc(t.title.slice(0, 31).replace(/[\\/?*[\]:]/g, ' '))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      name: 'xl/styles.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`,
    },
    { name: 'xl/worksheets/sheet1.xml', data: sheet },
  ])
}

/* ---------- PDF (single-font text report, WinAnsi encoding) ---------- */

function winAnsi(s: string): string {
  const map: Record<string, string> = { '‘': '\x91', '’': '\x92', 'ʻ': '\x91', 'ʼ': '\x92', '“': '\x93', '”': '\x94', '–': '\x96', '—': '\x97', '·': '\xb7', '→': '->', '…': '...' }
  let out = ''
  for (const ch of s) {
    if (map[ch]) out += map[ch]
    else if (ch.charCodeAt(0) < 256) out += ch
    else out += '?'
  }
  return out.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

export function toPdf(t: Table, subtitle: string): Uint8Array {
  const W = 842
  const H = 595
  const margin = 36
  const rowH = 18
  const usable = W - margin * 2
  const weights = t.columns.map((c, i) => Math.min(30, Math.max(c.length, ...t.rows.slice(0, 200).map((r) => String(r[i] ?? '').length))) + 2)
  const totalW = weights.reduce((a, b) => a + b, 0)
  const widths = weights.map((w) => (w / totalW) * usable)
  const xs = widths.map((_, i) => margin + widths.slice(0, i).reduce((a, b) => a + b, 0))
  const fit = (s: string, w: number, size: number) => {
    const max = Math.floor(w / (size * 0.52))
    return s.length > max ? s.slice(0, Math.max(1, max - 1)) + '…' : s
  }
  const perPage = Math.floor((H - margin * 2 - 70) / rowH)
  const pages: string[] = []
  const pageCount = Math.max(1, Math.ceil(t.rows.length / perPage))
  for (let p = 0; p < pageCount; p++) {
    const ops: string[] = []
    let y = H - margin
    if (p === 0) {
      ops.push(`BT /F2 16 Tf ${margin} ${y - 14} Td (${winAnsi(t.title)}) Tj ET`)
      ops.push(`BT /F1 9 Tf 0.45 0.5 0.6 rg ${margin} ${y - 30} Td (${winAnsi(subtitle)}) Tj ET`)
      y -= 50
    } else y -= 10
    ops.push(`0.93 0.95 1 rg ${margin} ${y - rowH + 4} ${usable} ${rowH} re f`)
    t.columns.forEach((c, i) => ops.push(`BT /F2 9 Tf 0.09 0.14 0.23 rg ${xs[i] + 4} ${y - 9} Td (${winAnsi(fit(c, widths[i] - 8, 9))}) Tj ET`))
    y -= rowH
    for (const r of t.rows.slice(p * perPage, (p + 1) * perPage)) {
      ops.push(`0.9 0.92 0.96 RG 0.5 w ${margin} ${y - rowH + 4} m ${margin + usable} ${y - rowH + 4} l S`)
      r.forEach((v, i) => ops.push(`BT /F1 9 Tf 0.09 0.14 0.23 rg ${xs[i] + 4} ${y - 9} Td (${winAnsi(fit(String(v), widths[i] - 8, 9))}) Tj ET`))
      y -= rowH
    }
    ops.push(`BT /F1 8 Tf 0.6 0.65 0.74 rg ${margin} ${margin - 12} Td (${winAnsi(`SalesAI demo hisobot · ${p + 1} / ${pageCount}`)}) Tj ET`)
    pages.push(ops.join('\n'))
  }

  const objs: string[] = []
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
  const kids: string[] = []
  pages.forEach((content, i) => {
    const pageId = 5 + i * 2
    const contentId = pageId + 1
    kids.push(`${pageId} 0 R`)
    objs[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`
    objs[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  })
  objs[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`

  let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'
  const offsets: number[] = []
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = out.length
    out += `${i} 0 obj\n${objs[i]}\nendobj\n`
  }
  const xref = out.length
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`
  for (let i = 1; i < objs.length; i++) out += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  const bytes = new Uint8Array(out.length)
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff
  return bytes
}

export function exportTable(t: Table, format: ExportFormat, baseName: string, subtitle = ''): string {
  const stamp = new Date().toISOString().slice(0, 10)
  const filename = `${baseName}-${stamp}.${format}`
  if (format === 'csv') download(new Blob(['\ufeff' + toCsv(t)], { type: 'text/csv;charset=utf-8' }), filename)
  else if (format === 'xlsx') download(new Blob([toXlsx(t) as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename)
  else download(new Blob([toPdf(t, subtitle) as BlobPart], { type: 'application/pdf' }), filename)
  return filename
}
