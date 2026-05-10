import { test, expect } from "@playwright/test";
import { getDefaultIntakeCategories } from "@/lib/intake/intake-categories";

test.describe("smart intake presets", () => {
  test("default categories have enabled questions and stable ids", () => {
    const categories = getDefaultIntakeCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.map((category) => category.id)).toContain("prayer");
    expect(categories.map((category) => category.id)).toContain("bible_study");

    for (const category of categories) {
      expect(category.label).toBeTruthy();
      expect(category.questions.length).toBeGreaterThan(0);
      for (const question of category.questions) {
        expect(question.id).toBeTruthy();
        expect(question.label).toBeTruthy();
      }
    }
  });
});
