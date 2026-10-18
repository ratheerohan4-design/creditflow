import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:3000";
mkdirSync("shots", { recursive: true });

const browser = await chromium.launch();
const problems = [];

async function open(width, height) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console@${width}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror@${width}: ${err.message}`));
  await page.setViewportSize({ width, height });
  return { context, page };
}

async function inspect(page, label, width) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    overflowing: [...document.querySelectorAll("body *")]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.right > window.innerWidth + 2 && rect.width > 0;
      })
      .slice(0, 3)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)}`),
    title: document.title,
    text: document.body.innerText.slice(0, 60),
  }));
  if (metrics.scrollWidth > metrics.clientWidth + 2)
    problems.push(`${label}@${width}: horizontal overflow ${metrics.scrollWidth} > ${metrics.clientWidth}`);
  if (metrics.overflowing.length)
    problems.push(`${label}@${width}: overflowing ${metrics.overflowing.join(", ")}`);
  if (!/CreditFlow/.test(metrics.title)) problems.push(`${label}@${width}: title "${metrics.title}"`);
  console.log(`${label}@${width}: ${metrics.title}`);
}

for (const width of [1440, 768, 390]) {
  const { context, page } = await open(width, width >= 1024 ? 1000 : 900);
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `shots/landing@${width}.png` });
  await inspect(page, "landing", width);

  if (width === 1440) {
    for (const [name, y] of [
      ["how", 1050],
      ["portals", 1900],
      ["security", 3050],
      ["faq", 3800],
    ]) {
      await page.evaluate((offset) => window.scrollTo(0, offset), y);
      await page.waitForTimeout(250);
      await page.screenshot({ path: `shots/landing-${name}@1440.png` });
    }
  }

  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `shots/login@${width}.png` });
  await inspect(page, "login", width);
  await context.close();
}

// Full OTP journey at desktop width.
const { context, page } = await open(1440, 1000);
await page.goto(`${BASE}/login`, { waitUntil: "load" });
await page.fill("#phone", "9876543210");
await page.getByRole("button", { name: /Send SMS code/i }).click();
await page.waitForTimeout(700);
await page.screenshot({ path: "shots/login-otp@1440.png" });

const demoCode = (await page.locator("div:has(> p:text-is('Demo code'))").first().innerText())
  .replace(/\D/g, "")
  .slice(0, 6);
console.log(`demo code: ${demoCode}`);

// Wrong code first: must show an error and stay on the OTP step.
await page.locator('input[aria-label="Digit 1 of 6"]').fill("000000");
await page.waitForTimeout(900);
console.log(`wrong code error: ${await page.locator("text=/does not match/i").count()}`);
console.log(`url after wrong code: ${new URL(page.url()).pathname}`);

await page.getByRole("button", { name: /^Autofill$/ }).click();
await page.waitForTimeout(1200);
console.log(`url after verify: ${new URL(page.url()).pathname}`);
await page.screenshot({ path: "shots/after-login@1440.png" });

await context.close();

// Truecaller fallback path.
const tc = await open(1440, 1000);
await tc.page.goto(`${BASE}/login`, { waitUntil: "load" });
await tc.page.fill("#phone", "9812345678");
await tc.page.getByRole("button", { name: /Verify with Truecaller/i }).click();
await tc.page.waitForTimeout(800);
console.log(`truecaller fallback step: ${await tc.page.locator("text=Demo code").count() > 0 ? "otp" : "phone"}`);
await tc.context.close();

await browser.close();

console.log(problems.length ? `PROBLEMS:${problems.length}\n${problems.join("\n")}` : "NO_PROBLEMS");
