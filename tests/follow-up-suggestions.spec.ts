import { test, expect } from "@playwright/test";
import { generateFollowUpSuggestion, detectFollowUpCategory } from "@/lib/follow-up-suggestions";
import { followUpCategoryLabels, followUpCategoryOptions } from "@/lib/constants";

test.describe("follow-up suggestions", () => {
  test("detects prayer from interests", () => {
    const category = detectFollowUpCategory({
      contact: { full_name: "Test", contact_interests: [{ interest: "prayer" }] },
      teams: []
    });
    expect(category).toBe("prayer");
  });

  test("detects bible study from interests", () => {
    const category = detectFollowUpCategory({
      contact: { full_name: "Test", contact_interests: [{ interest: "bible_study" }] },
      teams: []
    });
    expect(category).toBe("bible_study");
  });

  test("detects baptism from interests", () => {
    const category = detectFollowUpCategory({
      contact: { full_name: "Test", contact_interests: [{ interest: "baptism" }] },
      teams: []
    });
    expect(category).toBe("baptism_interest");
  });

  test("detects health from event type", () => {
    const category = detectFollowUpCategory({
      contact: { full_name: "Test", events: { name: "Health Expo", event_type: "health_expo" } },
      teams: []
    });
    expect(category).toBe("health_interest");
  });

  test("detects youth from event type", () => {
    const category = detectFollowUpCategory({
      contact: { full_name: "Test", events: { name: "Youth Night", event_type: "youth_event" } },
      teams: []
    });
    expect(category).toBe("youth_interest");
  });

  test("detects urgent from text", () => {
    const category = detectFollowUpCategory({
      contact: { full_name: "Test", classification_payload: { summary: "urgent help needed" } },
      teams: []
    });
    expect(category).toBe("urgent_follow_up");
  });

  test("defaults to general_visitor when no match", () => {
    const category = detectFollowUpCategory({
      contact: { full_name: "Test" },
      teams: []
    });
    expect(category).toBe("general_visitor");
  });

  test("generates suggestion with team and person", () => {
    const suggestion = generateFollowUpSuggestion({
      contact: { full_name: "Test", contact_interests: [{ interest: "prayer" }] },
      teams: [
        {
          team: {
            id: "team-1",
            church_id: "church-1",
            name: "Prayer Warriors",
            description: null,
            follow_up_categories: ["prayer"],
            is_active: true,
            created_at: "2025-01-01",
            updated_at: "2025-01-01",
            deleted_at: null
          },
          memberships: [
            { id: "m1", person_id: "p1", position_title: "Leader", person_full_name: "Alice Johnson" }
          ]
        }
      ]
    });

    expect(suggestion.category).toBe("prayer");
    expect(suggestion.team?.name).toBe("Prayer Warriors");
    expect(suggestion.person?.full_name).toBe("Alice Johnson");
    expect(suggestion.person?.position_title).toBe("Leader");
    expect(suggestion.suggested_action).toContain("pray");
  });

  test("returns empty team/person when no matching teams", () => {
    const suggestion = generateFollowUpSuggestion({
      contact: { full_name: "Test", contact_interests: [{ interest: "prayer" }] },
      teams: []
    });

    expect(suggestion.category).toBe("prayer");
    expect(suggestion.team).toBeNull();
    expect(suggestion.person).toBeNull();
  });

  test("category labels cover all options", () => {
    for (const cat of followUpCategoryOptions) {
      expect(followUpCategoryLabels[cat]).toBeDefined();
      expect(typeof followUpCategoryLabels[cat]).toBe("string");
    }
  });
});
