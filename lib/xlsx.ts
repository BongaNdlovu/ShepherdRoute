export type XlsxCell = string | number | boolean | null | undefined;

type WorksheetInput = {
  name: string;
  rows: XlsxCell[][];
  columnWidths?: number[];
  headerRow?: number;
  freezePane?: { xSplit?: number; ySplit?: number; topLeftCell?: string };
  autoFilter?: { from: string; to: string };
  wrapColumns?: number[];
};

const CRC_TABLE = createCrcTable();

export function xlsxResponse(fileName: string, workbook: Uint8Array) {
  return new Response(new Blob([workbook.buffer as ArrayBuffer]), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${fileName}"`
    }
  });
}

export function createWorkbook(sheets: WorksheetInput[]) {
  const files = new Map<string, string | Uint8Array>();

  files.set("[Content_Types].xml", contentTypesXml(sheets.length));
  files.set("_rels/.rels", rootRelsXml());
  files.set("xl/workbook.xml", workbookXml(sheets));
  files.set("xl/_rels/workbook.xml.rels", workbookRelsXml(sheets.length));
  files.set("xl/styles.xml", stylesXml());

  sheets.forEach((sheet, index) => {
    files.set(`xl/worksheets/sheet${index + 1}.xml`, worksheetXml(sheet));
  });

  return zipFiles(files);
}

function worksheetXml(sheet: WorksheetInput) {
  const headerRow = sheet.headerRow ?? 1;
  const wrapColumns = new Set(sheet.wrapColumns ?? []);
  const rowsXml = sheet.rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cells = row
        .map((cell, columnIndex) => {
          const ref = `${columnName(columnIndex + 1)}${rowNumber}`;
          const style = rowNumber === headerRow ? 2 : wrapColumns.has(columnIndex + 1) ? 3 : rowNumber < headerRow ? 1 : undefined;
          return cellXml(ref, cell, style);
        })
        .join("");

      return `<row r="${rowNumber}">${cells}</row>`;
    })
    .join("");

  const colsXml = sheet.columnWidths?.length
    ? `<cols>${sheet.columnWidths
        .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
        .join("")}</cols>`
    : "";
  const freezeXml = sheet.freezePane
    ? `<sheetViews><sheetView workbookViewId="0"><pane xSplit="${sheet.freezePane.xSplit ?? 0}" ySplit="${sheet.freezePane.ySplit ?? 0}" topLeftCell="${sheet.freezePane.topLeftCell ?? "A1"}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`;
  const autoFilterXml = sheet.autoFilter ? `<autoFilter ref="${sheet.autoFilter.from}:${sheet.autoFilter.to}"/>` : "";

  return xmlDecl(`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${freezeXml}<sheetFormatPr defaultRowHeight="15"/><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>${colsXml}<sheetData>${rowsXml}</sheetData>${autoFilterXml}</worksheet>`);
}

function cellXml(ref: string, cell: XlsxCell, style?: number) {
  const styleAttr = style ? ` s="${style}"` : "";

  if (cell === null || cell === undefined || cell === "") {
    return `<c r="${ref}"${styleAttr}/>`;
  }

  if (typeof cell === "number" && Number.isFinite(cell)) {
    return `<c r="${ref}"${styleAttr}><v>${cell}</v></c>`;
  }

  if (typeof cell === "boolean") {
    return `<c r="${ref}" t="b"${styleAttr}><v>${cell ? 1 : 0}</v></c>`;
  }

  return `<c r="${ref}" t="inlineStr"${styleAttr}><is><t>${escapeXml(String(cell))}</t></is></c>`;
}

function stylesXml() {
  return xmlDecl(`<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F4E5F"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD9E2E7"/></left><right style="thin"><color rgb="FFD9E2E7"/></right><top style="thin"><color rgb="FFD9E2E7"/></top><bottom style="thin"><color rgb="FFD9E2E7"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="top"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
}

function workbookXml(sheets: WorksheetInput[]) {
  const sheetEntries = sheets
    .map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join("");

  return xmlDecl(`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetEntries}</sheets></workbook>`);
}

function workbookRelsXml(sheetCount: number) {
  const sheetRels = Array.from({ length: sheetCount }, (_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
  return xmlDecl(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetRels}<Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
}

function contentTypesXml(sheetCount: number) {
  const sheetOverrides = Array.from({ length: sheetCount }, (_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  return xmlDecl(`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheetOverrides}</Types>`);
}

function rootRelsXml() {
  return xmlDecl(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
}

function zipFiles(files: Map<string, string | Uint8Array>) {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const [name, content] of files) {
    const nameBytes = encode(name);
    const data = typeof content === "string" ? encode(content) : content;
    const crc = crc32(data);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);

    chunks.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    central.push(centralHeader);

    offset += localHeader.length + data.length;
  }

  const centralOffset = offset;
  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  chunks.push(...central);

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.size, true);
  endView.setUint16(10, files.size, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, centralOffset, true);
  chunks.push(end);

  return concat(chunks);
}

function createCrcTable() {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  return table;
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function concat(chunks: Uint8Array[]) {
  const output = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }

  return output;
}

function encode(value: string) {
  return new TextEncoder().encode(value);
}

function columnName(index: number) {
  let name = "";
  let value = index;

  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }

  return name;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xmlDecl(value: string) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${value}`;
}
