import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const hasAuth = Boolean(email && password);
const requireAuthSmoke = process.env.E2E_REQUIRE_AUTH === "true";

test("authenticated smoke credentials are configured when required", async () => {
  test.skip(!requireAuthSmoke, "Set E2E_REQUIRE_AUTH=true to require authenticated smoke credentials.");
  expect(process.env.E2E_EMAIL, "E2E_EMAIL must be configured").toBeTruthy();
  expect(process.env.E2E_PASSWORD, "E2E_PASSWORD must be configured").toBeTruthy();
});

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Please check your email and password.")).toBeHidden();
  await expect(page).toHaveURL(/\/(dashboard|contacts|events|follow-ups|reports|profile|settings)(\/)?$/);
  await expect(page.getByRole("button", { name: /log out|logout/i })).toBeVisible();
}

test("public auth pages load", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: /start shepherdroute/i })).toBeVisible();
  await expect(page.getByLabel("Signup code")).toBeVisible();
});

test.describe("authenticated smoke flow", () => {
  test.skip(!hasAuth, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated smoke tests.");

  test("creates an event, verifies QR actions, submits public form, and finds contact", async ({ page }) => {
    await login(page);

    const eventName = `Smoke Test Event ${Date.now()}`;
    const visitorName = `Smoke Visitor ${Date.now()}`;

    await page.getByRole("link", { name: "Events" }).click();
    await page.getByRole("link", { name: /new event|create your first event|create first event/i }).first().click();
    await page.getByLabel("Event name").fill(eventName);
    await page.getByLabel("Location").fill("Smoke Test Hall");
    await page.getByRole("button", { name: /create event and get qr code/i }).click();

    await expect(page.getByRole("heading", { name: eventName, exact: true }).first()).toBeVisible();
    await expect(page).toHaveURL(/\/events\/[^/]+(\/customize)?$/);
    const eventPathMatch = new URL(page.url()).pathname.match(/^\/events\/([^/]+)/);
    expect(eventPathMatch?.[1]).toBeTruthy();
    await page.goto(`/events/${eventPathMatch![1]}`);
    await expect(page.getByRole("heading", { name: eventName, exact: true }).first()).toBeVisible();

    await expect(page.getByRole("button", { name: "PNG" })).toBeVisible();
    await expect(page.getByRole("button", { name: "SVG" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
    await expect(page.getByRole("button", { name: /copy link/i })).toBeVisible();

    const publicHref = await page.getByRole("link", { name: /open public form/i }).getAttribute("href");
    expect(publicHref).toBeTruthy();

    const publicUrl = new URL(publicHref!, page.url()).pathname;
    await page.goto(publicUrl);
    await expect(page).toHaveURL(/\/e\/[^/]+$/);
    await expect(page.getByLabel("Full name")).toBeVisible();
    await page.getByLabel("Full name").fill(visitorName);
    await page.getByLabel("Phone / WhatsApp").fill("+27 71 000 1234");
    await page.getByRole("textbox", { name: "Email" }).fill(`smoke.visitor.${Date.now()}@example.com`);
    await page.getByLabel("Area / suburb").fill("Pinetown");
    await page.getByLabel(/Bible Study/i).first().check();
    await page.getByLabel("Optional message / prayer request").fill("Please send Bible study information.");
    await page.getByRole("checkbox", { name: "WhatsApp" }).check();
    await page.getByRole("button", { name: "Submit visitor form" }).click();
    await expect(page.getByRole("heading", { name: "Thank you" })).toBeVisible();

    await page.goto("/contacts");
    await page.getByPlaceholder("Search name, phone, area...").fill(visitorName);
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("link", { name: visitorName })).toBeVisible();
  });

  test("creates a manual contact and verifies suggested WhatsApp is available", async ({ page }) => {
    await login(page);

    const contactName = `Smoke Manual Contact ${Date.now()}`;

    await page.goto("/contacts#add-contact");
    await page.locator("#add-contact").getByLabel("Name").fill(contactName);
    const addContactForm = page.locator("#add-contact");
    await addContactForm.getByLabel("Phone / WhatsApp").fill("+27 72 000 5678");
    await addContactForm.getByLabel(/Bible Study/i).first().check();
    await addContactForm.getByLabel("Prayer request or note").fill("Interested in Bible study.");
    await addContactForm.getByRole("button", { name: "Add contact" }).click();

    await expect(page).toHaveURL(/\/contacts\/[^/?#]+(?:\?.*)?$/, { timeout: 30000 });
    await expect(page.getByText(/could not|please add|invalid/i)).toBeHidden();
    await expect(page.getByRole("heading", { name: contactName, exact: true })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("button", { name: /save and open in whatsapp|open whatsapp|open whatsapp again|opted out/i }).first()).toBeVisible();
  });
});
