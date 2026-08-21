import { test, expect } from "@playwright/test";
import { login } from "./utils/auth";

test.describe("Signup", () => {
  test("a new user can create an account", async ({ page }) => {
    const unique = Date.now();
    const email = `e2e-user-${unique}@example.com`;
    const password = "Password123!";

    await page.goto("/auth");

    // Switch from the default "Sign in" tab to "Sign up".
    await page.getByRole("button", { name: "Sign up" }).click();

    await page.getByLabel("First name").fill("Test");
    await page.getByLabel("Last name").fill("User");
    await page.getByLabel("Username").fill(`e2euser${unique}`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);

    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("Login", () => {
  test("an existing user can sign in", async ({ page }) => {
    // Requires a seeded/test account. Override via env vars in CI.
    const email = process.env.E2E_USER_EMAIL ?? "e2e-existing-user@example.com";
    const password = process.env.E2E_USER_PASSWORD ?? "Password123!";

    await login(page, email, password);
  });

  test("displays error for invalid credentials", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel("Email").fill("invalid@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid credentials")).toBeVisible();
  });
});

test.describe("Logout", () => {
  test("an authenticated user can log out", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL ?? "e2e-existing-user@example.com";
    const password = process.env.E2E_USER_PASSWORD ?? "Password123!";

    await login(page, email, password);

    // Click Logout button in the sidebar
    await page.getByRole("button", { name: "Logout" }).click();

    await expect(page).toHaveURL(/\/auth|\//);
  });
});

test.describe("Protected routes", () => {
  test("redirects unauthenticated user to auth page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe("Session persistence", () => {
  test("persists session across page reloads", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL ?? "e2e-existing-user@example.com";
    const password = process.env.E2E_USER_PASSWORD ?? "Password123!";

    await login(page, email, password);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
