import { chromium } from "playwright";

const BASE = "http://127.0.0.1:3000";
const problems = [];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
page.on("console", (m) => { if (m.type() === "error") problems.push(`console: ${m.text()}`); });
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

const owedOnHome = async () => {
  const text = await page.innerText("body");
  const seg = text.split("Amount you still owe")[1] ?? "";
  const m = seg.match(/₹([\d,]+)/);
  return m ? Number(m[1].replace(/,/g, "")) : NaN;
};

const step = async (name, fn) => {
  try { await fn(); console.log(`ok   ${name}`); }
  catch (e) { problems.push(`${name}: ${e.message.split("\n")[0]}`); console.log(`FAIL ${name}`); }
};

await step("login flow", async () => {
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.fill("#phone", "9876543210");
  await page.click("button:has-text('Send code')");
  await page.fill("#otp", "123456");
  await page.click("text=Continue as Merchant");
  await page.waitForURL("**/merchant", { timeout: 8000 });
  await page.waitForTimeout(900);
  const text = await page.innerText("body");
  if (!text.includes("Amount you still owe")) throw new Error("home did not render");
});

await step("log cash sale", async () => {
  const owedBefore = await owedOnHome();
  await page.goto(`${BASE}/merchant/log-cash-sale`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  await page.fill("#amount", "1500");
  await page.click("button:has-text('Log cash sale')");
  await page.waitForTimeout(1500);
  const text = await page.innerText("body");
  if (!text.includes("logged as a cash sale")) throw new Error("no receipt shown");
  if (!text.includes("Logged by merchant") && !text.includes("cash sale")) throw new Error("receipt missing cash label");
  await page.goto(`${BASE}/merchant`, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const owedAfter = await owedOnHome();
  if (!(owedAfter < owedBefore)) throw new Error(`balance did not drop: ${owedBefore} -> ${owedAfter}`);
  console.log(`     balance ${owedBefore} -> ${owedAfter}`);
});

await step("override requires reason", async () => {
  await page.evaluate(() => {
    window.localStorage.setItem("creditflow-session", JSON.stringify({
      state: { role: "admin", name: "Priya Nair", phone: "9876543210", merchantId: null, lenderId: null, signedInAt: new Date().toISOString() },
      version: 0,
    }));
  });
  await page.goto(`${BASE}/admin/overrides`, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.click("#agreementId");
  await page.waitForTimeout(300);
  await page.getByRole("option", { name: /CF-AG-1042/ }).click();
  await page.waitForTimeout(300);
  const review = page.locator("button:has-text('Review and apply')");
  if (!(await review.isDisabled())) throw new Error("review enabled with no value entered");
  await page.fill("#override-value", "500");
  await page.waitForTimeout(250);
  if (await review.isDisabled()) throw new Error("review stayed disabled after a value");
  await review.click();
  await page.waitForTimeout(600);
  const confirm = page.locator("[role='alertdialog'] button:has-text('Apply override')");
  if (!(await confirm.isVisible())) throw new Error("confirm dialog did not open");
  if (!(await confirm.isDisabled())) throw new Error("confirm enabled without a reason");
  await page.fill("#confirm-reason", "Merchant shared the customer's payment screenshot.");
  await page.waitForTimeout(250);
  if (await confirm.isDisabled()) throw new Error("confirm stayed disabled after a reason");
  await confirm.click();
  await page.waitForTimeout(1500);
  const text = await page.innerText("body");
  if (!text.includes("Override applied")) throw new Error("no success banner");
  await page.goto(`${BASE}/admin/audit`, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const audit = await page.innerText("body");
  if (!audit.includes("Balance adjusted")) throw new Error("override missing from audit log");
});

await browser.close();
console.log(problems.length === 0 ? "FLOWS_OK" : `FLOW_PROBLEMS:${problems.length}`);
for (const p of problems) console.log(` - ${p}`);
process.exit(problems.length === 0 ? 0 : 1);
