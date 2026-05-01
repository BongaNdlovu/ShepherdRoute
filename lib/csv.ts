export function normalizeCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("; ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function escapeCsvValue(value: unknown) {
  let text = normalizeCsvValue(value);

  if (/^[=+\-@]/.test(text) || /^[\s\t\r\n]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: Array<Array<unknown>>) {
  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(","))
  ].join("\r\n");
}

export function csvResponse(fileName: string, csv: string) {
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fileName}"`
    }
  });
}

export function streamCsvResponse(fileName: string, headers: string[], rows: AsyncIterable<Array<unknown>>) {
  const encoder = new TextEncoder();
  const iterator = rows[Symbol.asyncIterator]();
  let sentHeader = false;

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!sentHeader) {
        sentHeader = true;
        controller.enqueue(encoder.encode(`${headers.map(escapeCsvValue).join(",")}\r\n`));
        return;
      }

      const next = await iterator.next();
      if (next.done) {
        controller.close();
        return;
      }

      controller.enqueue(encoder.encode(`${next.value.map(escapeCsvValue).join(",")}\r\n`));
    },
    async cancel() {
      if (iterator.return) {
        await iterator.return();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fileName}"`
    }
  });
}
