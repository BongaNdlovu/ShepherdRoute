"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, ExternalLink, Printer, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function safeFileName(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") || "event";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function QrCard({ eventName, url }: { eventName: string; url: string }) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const fileBaseName = `${safeFileName(eventName)}-qr`;

  function getQrSvgMarkup(size = 1024) {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return null;

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(size));
    clone.setAttribute("height", String(size));

    return new XMLSerializer().serializeToString(clone);
  }

  function downloadSvg() {
    const svgMarkup = getQrSvgMarkup();
    if (!svgMarkup) return;

    downloadBlob(new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" }), `${fileBaseName}.svg`);
  }

  function downloadPng() {
    const svgMarkup = getQrSvgMarkup();
    if (!svgMarkup) return;

    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;

      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);

      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, `${fileBaseName}.png`);
        }
      }, "image/png");
    };

    image.onerror = () => URL.revokeObjectURL(objectUrl);
    image.src = objectUrl;
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function printQr() {
    const svgMarkup = getQrSvgMarkup();
    if (!svgMarkup) return;

    const printWindow = window.open("", "_blank", "width=720,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(eventName)} QR</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 40px;
              color: #0f172a;
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .sheet {
              margin: 0 auto;
              max-width: 620px;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
              padding: 36px;
            }
            h1 {
              margin: 0;
              font-size: 30px;
              line-height: 1.15;
            }
            p {
              margin: 12px 0 0;
              color: #475569;
              font-size: 16px;
              line-height: 1.5;
            }
            .qr {
              margin: 32px auto 24px;
              width: 360px;
              max-width: 100%;
            }
            .qr svg {
              width: 100%;
              height: auto;
            }
            .url {
              overflow-wrap: anywhere;
              font-weight: 700;
            }
            @media print {
              body { padding: 0; }
              .sheet { border: 0; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <main class="sheet">
            <h1>${escapeHtml(eventName)}</h1>
            <p>Scan to register for follow-up.</p>
            <div class="qr">${svgMarkup}</div>
            <p class="url">${escapeHtml(url)}</p>
          </main>
          <script>
            window.addEventListener("load", () => {
              window.print();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <Card className="bg-primary text-primary-foreground">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-white/10 p-3">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Current event QR</CardTitle>
            <p className="text-sm text-white/60">{eventName}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-white p-5" ref={qrRef}>
          <QRCodeSVG value={url} className="mx-auto h-48 w-48" />
          <p className="mt-4 break-all text-center text-sm font-semibold text-slate-600">{url}</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={downloadPng}>
            <Download className="h-4 w-4" />
            PNG
          </Button>
          <Button type="button" variant="secondary" onClick={downloadSvg}>
            <Download className="h-4 w-4" />
            SVG
          </Button>
          <Button type="button" variant="secondary" onClick={printQr}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button type="button" variant="secondary" onClick={copyLink}>
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
        <Button asChild variant="secondary" className="mt-2 w-full">
          <a href={url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            Preview public form
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
