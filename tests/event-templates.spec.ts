import { expect, test } from "@playwright/test";
import { classifyContact } from "@/lib/classifyContact";
import { eventTemplates, getEventTemplate } from "@/lib/eventTemplates";
import { generateMessage } from "@/lib/whatsapp";

test.describe("event templates", () => {
  test("health expo template exposes health expo form options", () => {
    const template = getEventTemplate("health_expo");
    const labels = template.interestOptions.map((option) => option.label);

    expect(template.formHeading).toContain("health expo");
    expect(labels).toContain("Health Tips");
    expect(labels).toContain("7-Day Health Challenge");
    expect(labels).toContain("Cooking Class");
  });

  test("evangelistic campaign template exposes evangelistic options", () => {
    const template = getEventTemplate("evangelistic_campaign");
    const labels = template.interestOptions.map((option) => option.label);

    expect(template.formHeading).toContain("Bible presentation");
    expect(labels).toContain("Study Notes");
    expect(labels).toContain("Next Meeting Updates");
    expect(labels).toContain("Baptism Preparation");
  });

  test("sabbath visitor template exposes visitor options", () => {
    const template = getEventTemplate("sabbath_visitor");
    const labels = template.interestOptions.map((option) => option.label);

    expect(template.formHeading).toContain("worshipped");
    expect(labels).toContain("Church Updates");
    expect(labels).toContain("Bible Study");
    expect(labels).toContain("Youth Info");
  });

  test("prophecy seminar includes topic options", () => {
    const template = getEventTemplate("prophecy_seminar");

    expect(template.topicOptions).toContain("Daniel 2");
    expect(template.topicOptions).toContain("Revelation 14");
    expect(template.topicOptions).toContain("Three Angels' Messages");
  });

  test("cooking class uses cooking class WhatsApp template", () => {
    const message = generateMessage({
      name: "Nomsa Dlamini",
      phone: "+27820000000",
      interests: ["cooking_class"],
      churchName: "Pinetown SDA",
      eventName: "Healthy Cooking Sunday",
      templateType: "cooking_class"
    });

    expect(message).toContain("recipes");
    expect(message).toContain("next healthy cooking class is planned");
  });

  test("classifier receives event type and changes routing", () => {
    const result = classifyContact({ templateType: "prayer_campaign", message: "Please remember my family." });

    expect(result.recommended_tags).toContain("prayer");
    expect(result.recommended_assigned_role).toBe("prayer_team");
  });

  test("health expo health interest routes to health leader", () => {
    const result = classifyContact({ selectedInterests: ["health"], templateType: "health_expo" });

    expect(result.recommended_tags).toContain("health");
    expect(result.recommended_assigned_role).toBe("health_leader");
  });

  test("prophecy seminar baptism interest routes to bible_worker", () => {
    const result = classifyContact({
      selectedInterests: ["baptism"],
      templateType: "prophecy_seminar",
      message: "I want baptism preparation after Revelation 14."
    });

    expect(result.recommended_tags).toContain("baptism");
    expect(result.recommended_assigned_role).toBe("bible_worker");
  });

  test("empty custom event falls back to general visitor logic", () => {
    const result = classifyContact({ templateType: "custom" });

    expect(result.recommended_tags).toEqual(["general_visit"]);
    expect(result.recommended_assigned_role).toBe("elder");
  });

  test("new member templates are available", () => {
    expect(getEventTemplate("regular_member").name).toBe("Regular Member");
    expect(getEventTemplate("baptized_member").name).toBe("Baptized Member");
    expect(getEventTemplate("health_seminar").name).toBe("Health Seminar");
  });

  test("every event template includes a baptism interest option", () => {
    const templateTypes = Object.keys(eventTemplates) as Array<keyof typeof eventTemplates>;

    for (const templateType of templateTypes) {
      const template = eventTemplates[templateType];
      const values = template.interestOptions.map((option) => option.value);
      expect(values).toContain("baptism");
    }
  });

  test("every event template with a baptism option has a baptism-specific message template", () => {
    const templateTypes = Object.keys(eventTemplates) as Array<keyof typeof eventTemplates>;

    for (const templateType of templateTypes) {
      const template = eventTemplates[templateType];
      const values = template.interestOptions.map((option) => option.value);
      if (values.includes("baptism")) {
        expect(template.messageTemplates.baptism).toBeDefined();
        expect(template.messageTemplates.baptism).toContain("baptismal request");
        expect(template.messageTemplates.baptism).toContain("Bible worker");
      }
    }
  });

  test("every event template with a prayer option has a prayer-specific message template", () => {
    const templateTypes = Object.keys(eventTemplates) as Array<keyof typeof eventTemplates>;

    for (const templateType of templateTypes) {
      const template = eventTemplates[templateType];
      const values = template.interestOptions.map((option) => option.value);
      if (values.includes("prayer")) {
        expect(template.messageTemplates.prayer).toBeDefined();
        expect(template.messageTemplates.prayer).toContain("prayer request");
        expect(template.messageTemplates.prayer).toContain("prayer team");
      }
    }
  });

  test("every event template with a baptism option exposes a baptismal report section", () => {
    const templateTypes = Object.keys(eventTemplates) as Array<keyof typeof eventTemplates>;

    for (const templateType of templateTypes) {
      const template = eventTemplates[templateType];
      const values = template.interestOptions.map((option) => option.value);
      if (values.includes("baptism")) {
        const hasBaptismSection = template.reportSections.some(
          section => section.interest === "baptism" || section.label.toLowerCase().includes("baptism")
        );
        expect(hasBaptismSection).toBe(true);
      }
    }
  });

  test("event message templates use compassionate consent-based language", () => {
    const templateTypes = Object.keys(eventTemplates) as Array<keyof typeof eventTemplates>;

    for (const templateType of templateTypes) {
      const template = eventTemplates[templateType];
      const messages = Object.values(template.messageTemplates).filter(Boolean);

      expect(messages.length).toBeGreaterThan(0);

      for (const message of messages) {
        expect(message).toMatch(/Good day \{firstName\}/);
        expect(message).not.toMatch(/\bcan arrange a respectful human follow-up\b/i);
        expect(message).not.toMatch(/\bWe received your baptismal request and can connect\b/i);
        expect(message).not.toMatch(/\bYou mentioned Bible study interest\b/i);
        expect(message).not.toMatch(/\bwould like us to send\b/i);
      }
    }
  });

  test("generated baptism messages are warm and include preparation support", () => {
    const message = generateMessage({
      name: "Thandi M.",
      phone: "+27820000000",
      interests: ["baptism"],
      churchName: "Pinetown SDA",
      eventName: "Sabbath Worship",
      templateType: "sabbath_visitor"
    });

    expect(message).toContain("Thank you for sharing your baptismal request");
    expect(message).toContain("honoured to connect you with a Bible worker");
    expect(message).toContain("walk with you through preparation");
    expect(message).not.toContain("Reply STOP");
  });

  test("message templates try the next matching interest before default", () => {
    const message = generateMessage({
      name: "Thandi M.",
      phone: "+27820000000",
      interests: ["pastoral_visit", "baptism"],
      churchName: "Pinetown SDA",
      eventName: "Sabbath Worship",
      templateType: "sabbath_visitor"
    });

    expect(message).toContain("baptismal request");
    expect(message).toContain("Bible worker");
    expect(message).not.toContain("checks in with you this week");
  });

  test("regular member prayer requests use prayer language instead of generic routing", () => {
    const message = generateMessage({
      name: "Kelly Conning",
      phone: "+27820000000",
      interests: ["prayer"],
      churchName: "Pinetown SDA Church",
      templateType: "regular_member"
    });

    expect(message).toContain("Good day Kelly");
    expect(message).toContain("prayer request");
    expect(message).toContain("prayer team");
    expect(message).not.toContain("route your request");
    expect(message).not.toContain("Reply STOP");
  });
});
