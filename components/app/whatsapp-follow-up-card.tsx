import { MessageCircle } from "lucide-react";
import { saveGeneratedMessageAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WhatsappFollowUpCardProps = {
  contactId: string;
  phone: string;
  message: string;
  doNotContact?: boolean;
};

export function WhatsappFollowUpCard({ contactId, phone, message, doNotContact }: WhatsappFollowUpCardProps) {
  return (
    <Card className={doNotContact ? "border-slate-200 bg-slate-50" : "border-emerald-100 bg-emerald-50"}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${doNotContact ? "text-slate-800" : "text-emerald-950"}`}>
          <MessageCircle className="h-5 w-5" />
          WhatsApp follow-up
        </CardTitle>
        <CardDescription className={doNotContact ? "text-slate-600" : "text-emerald-900/75"}>
          {doNotContact ? "This contact has opted out. Do not send follow-up messages." : "Generated from selected interest tags."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className={`text-sm leading-6 ${doNotContact ? "text-slate-700" : "text-emerald-950"}`}>{message}</p>
        <form action={saveGeneratedMessageAction} className="mt-4">
          <input type="hidden" name="contactId" value={contactId} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="message" value={message} />
          <Button type="submit" variant={doNotContact ? "outline" : "success"} className="w-full" disabled={doNotContact}>
            {doNotContact ? "Do not contact" : "Save and open in WhatsApp"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
