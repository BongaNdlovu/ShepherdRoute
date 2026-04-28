"use client";

import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QrCard({ eventName, url }: { eventName: string; url: string }) {
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
        <div className="rounded-lg bg-white p-5">
          <QRCodeSVG value={url} className="mx-auto h-48 w-48" />
          <p className="mt-4 break-all text-center text-sm font-semibold text-slate-600">{url}</p>
        </div>
        <Button asChild variant="secondary" className="mt-4 w-full">
          <a href={url} target="_blank" rel="noreferrer">Preview public form</a>
        </Button>
      </CardContent>
    </Card>
  );
}
