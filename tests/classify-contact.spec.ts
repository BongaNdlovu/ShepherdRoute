import { expect, test } from "@playwright/test";
import { classifyContact } from "@/lib/classifyContact";

const unsafeAdvicePattern = /\b(counselling|counseling|diagnos(?:e|is)|medical advice|clinical advice|treatment|prescribe)\b/i;

test.describe("rule-based contact classifier", () => {
  test("selected Bible Study interest routes to a Bible worker", () => {
    const result = classifyContact({ selectedInterests: ["bible_study"] });

    expect(result.recommended_tags).toContain("bible_study");
    expect(result.recommended_assigned_role).toBe("bible_worker");
  });

  test("baptism message routes to a pastor", () => {
    const result = classifyContact({ message: "I want to ask about baptism and joining the church." });

    expect(result.recommended_tags).toContain("baptism");
    expect(result.recommended_assigned_role).toBe("pastor");
  });

  test("health expo visitor with health wording routes to health leader", () => {
    const result = classifyContact({
      visitorType: "health_expo",
      message: "I enjoyed the health expo and want nutrition and NEWSTART lifestyle resources."
    });

    expect(result.recommended_tags).toContain("health");
    expect(result.recommended_assigned_role).toBe("health_leader");
  });

  test("prayer plus family wording has medium urgency", () => {
    const result = classifyContact({
      selectedInterests: ["prayer"],
      message: "Please pray for my family and home."
    });

    expect(result.recommended_tags).toContain("prayer");
    expect(result.recommended_tags).toContain("family_support");
    expect(result.urgency).toBe("medium");
  });

  test("urgent wording routes same-day human follow-up to pastor", () => {
    const result = classifyContact({ message: "This is urgent and I need someone to contact me today." });

    expect(result.recommended_tags).toContain("urgent_follow_up");
    expect(result.urgency).toBe("high");
    expect(result.recommended_assigned_role).toBe("pastor");
  });

  test("empty input defaults to general visit and elder route", () => {
    const result = classifyContact({});

    expect(result.recommended_tags).toEqual(["general_visit"]);
    expect(result.urgency).toBe("low");
    expect(result.recommended_assigned_role).toBe("elder");
  });

  test("always returns JSON-shaped classification data", () => {
    const result = classifyContact({ selectedInterests: ["health"], message: "Plant based cooking class please." });
    const parsed = JSON.parse(JSON.stringify(result));

    expect(typeof parsed.summary).toBe("string");
    expect(Array.isArray(parsed.recommended_tags)).toBe(true);
    expect(["low", "medium", "high"]).toContain(parsed.urgency);
    expect(typeof parsed.recommended_next_action).toBe("string");
    expect(["pastor", "elder", "bible_worker", "health_leader", "prayer_team"]).toContain(parsed.recommended_assigned_role);
  });

  test("next action avoids counselling, diagnosis, and medical advice", () => {
    const examples = [
      classifyContact({ message: "urgent emergency today" }),
      classifyContact({ selectedInterests: ["health"], message: "stress and sleep help" }),
      classifyContact({ message: "I am struggling and want to talk to the pastor" })
    ];

    for (const result of examples) {
      expect(result.recommended_next_action).not.toMatch(unsafeAdvicePattern);
    }
  });
});
