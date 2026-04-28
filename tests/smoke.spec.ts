import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const hasAuth = Boolean(email && password);

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("heading", { name: /capture\. care\. follow up\. disciple\./i })).toBeVisible();
}

test("public auth pages load", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: /start shepardroute/i })).toBeVisible();
});

test.describe("authenticated smoke flow", () => {
  test.skip(!hasAuth, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated smoke tests.");

  test("creates an event, verifies QR actions, submits public form, and finds contact", async ({ page }) => {
    await login(page);

    const eventName = `Smoke Test Event ${Date.now()}`;
    const visitorName = `Smoke Visitor ${Date.now()}`;

    await page.getByRole("link", { name: "Events" }).click();
    await page.getByRole("link", { name: "Create event" }).click();
    await page.getByLabel("Event name").fill(eventName);
    await page.getByLabel("Location").fill("Smoke Test Hall");
    await page.getByRole("button", { name: "Create QR registration page" }).click();

    await expect(page.getByRole("link", { name: eventName })).toBeVisible();
    await page.getByRole("link", { name: eventName }).click();
    await expect(page.getByText(eventName)).toBeVisible();

    await expect(page.getByRole("button", { name: "PNG" })).toBeVisible();
    await expect(page.getByRole("button", { name: "SVG" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
    await expect(page.getByRole("button", { name: /copy link/i })).toBeVisible();

    const publicHref = await page.getByRole("link", { name: "Open public form" }).getAttribute("href");
    expect(publicHref).toBeTruthy();

    await page.goto(publicHref!);
    await expect(page.getByText(eventName)).toBeVisible();
    await page.getByLabel("Name").fill(visitorName);
    await page.getByLabel("Phone / WhatsApp").fill("+27 71 000 1234");
    await page.getByLabel("Area / suburb").fill("Pinetown");
    await page.getByText("Bible Study").click();
    await page.getByLabel("Optional message / prayer request").fill("Please send Bible study information.");
    await page.getByRole("checkbox", { name: /I consent/i }).check();
    await page.getByRole("button", { name: "Submit visitor form" }).click();
    await expect(page.getByRole("heading", { name: "Thank you" })).toBeVisible();

    await page.goto("/contacts");
    await page.getByPlaceholder("Search name, phone, area...").fill(visitorName);
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("link", { name: visitorName })).toBeVisible();
  });
});
