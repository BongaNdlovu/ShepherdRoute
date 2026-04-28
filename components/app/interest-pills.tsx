import { Badge } from "@/components/ui/badge";
import { interestLabels, type Interest } from "@/lib/constants";

export function InterestPills({ interests }: { interests: Array<{ interest: Interest } | Interest> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {interests.map((item) => {
        const interest = typeof item === "string" ? item : item.interest;
        return (
          <Badge key={interest} variant="secondary">
            {interestLabels[interest]}
          </Badge>
        );
      })}
    </div>
  );
}
