import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type ContactFormAnswer = {
  question_name: string;
  question_label: string;
  question_type: string;
  answer_value: unknown;
  answer_display: unknown;
  created_at: string;
};

type ContactTemplateAnswersPanelProps = {
  churchId: string;
  contactId: string;
};

export async function ContactTemplateAnswersPanel({ churchId, contactId }: ContactTemplateAnswersPanelProps) {
  const supabase = await createClient();
  const { data: answers } = await supabase
    .from("contact_form_answers")
    .select("*")
    .eq("church_id", churchId)
    .eq("contact_id", contactId)
    .order("created_at", { ascending: true });

  if (!answers || answers.length === 0) {
    return null;
  }

  const formatAnswerValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    return String(value ?? "");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Answers</CardTitle>
        <CardDescription>Additional information provided during registration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {answers.map((answer: ContactFormAnswer) => (
          <div key={answer.question_name} className="grid gap-1 rounded-lg border p-4">
            <p className="text-sm font-semibold">{answer.question_label}</p>
            <p className="text-sm text-muted-foreground">
              {formatAnswerValue(answer.answer_display)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
