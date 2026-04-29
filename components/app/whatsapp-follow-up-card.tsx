import { MessageCircle } from "lucide-react";
import { saveGeneratedMessageAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WhatsappFollowUpCardProps = {
  contactId: string;
  phone: string;
  message: string;
};

export function WhatsappFollowUpCard({ contactId, phone, message }: WhatsappFollowUpCardProps) {
  return (
    <Card className="border-emerald-100 bg-emerald-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-950">
          <MessageCircle className="h-5 w-5" />
          WhatsApp follow-up
        </CardTitle>
        <CardDescription className="text-emerald-900/75">Generated from selected interest tags.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-emerald-950">{message}</p>
        <form action={saveGeneratedMessageAction} className="mt-4">
          <input type="hidden" name="contactId" value={contactId} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="message" value={message} />
          <Button type="submit" variant="success" className="w-full">Save and open in WhatsApp</Button>
        </form>
      </CardContent>
    </Card>
  );
}
