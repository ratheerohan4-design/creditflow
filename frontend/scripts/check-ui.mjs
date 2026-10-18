import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:3000";
const WIDTHS = [360, 390, 768, 1440];

const PORTALS = {
  merchant: [
    "/merchant",
    "/merchant/progress",
    "/merchant/qr",
    "/merchant/alerts",
    "/merchant/more",
    "/merchant/credit",
    "/merchant/transactions",
    "/merchant/agreement",
    "/merchant/subscription",
    "/merchant/support",
    "/merchant/log-cash-sale",
  ],
  lender: [
    "/lender",
    "/lender/merchants",
    "/lender/merchants/m1",
    "/lender/merchants/m1/agreement",
    "/lender/risk",
    "/lender/history",
    "/lender/completed",
  ],
  admin: [
    "/admin",
    "/admin/leads",
    "/admin/verification",
    "/admin/verification/VF-2210",
    "/admin/agreement-new",
    "/admin/qr",
    "/admin/overrides",
    "/admin/disputes",
    "/admin/disputes/DSP-318",
    "/admin/fees",
    "/admin/risk",
    "/admin/audit",
  ],
};

const SHOTS = new Set([
  "login:/login@390",
  "login:/login@1440",
  "merchant:/merchant@360",
  "merchant:/merchant@390",
  "merchant:/merchant@768",
  "merchant:/merchant@1440",
  "merchant:/merchant/progress@390",
  "merchant:/merchant/qr@390",
  "merchant:/merchant/transactions@390",
  "lender:/lender@1440",
  "lender:/lender@390",
  "lender:/lender/merchants@1440",
  "lender:/lender/risk@390",
  "admin:/admin@1440",
  "admin:/admin/leads@1440",
  "admin:/admin/verification/VF-2210@1440",
  "admin:/admin/audit@768",
  "admin:/admin@390",
]);

const session = (role, name, extra) =>
  JSON.stringify({
    state: {
      role,
      name,
      phone: "9876543210",
      signedInAt: new Date().toISOString(),
      ...extra,
    },
    version: 0,
  });

const SESSIONS = {
  merchant: session("merchant", "Rakesh Sharma", { merchantId: "m1", lenderId: null }),
  lender: session("lender", "Suresh Chandra", { merchantId: null, lenderId: "l1" }),
  admin: session("admin", "Priya Nair", { merchantId: null, lenderId: null }),
};

mkdirSync("shots", { recursive: true });

const browser = await chromium.launch();
const problems = [];
const results = [];

async function visit(context, label, path, width, height) {
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.setViewportSize({ width, height: height ?? (width >= 1024 ? 900 : 844) });
  await page.goto(`${BASE}${path}`, { waitUntil: "load" });
  await page.waitForTimeout(750);

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflowing = [...document.querySelectorAll("body *")]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.right > window.innerWidth + 2 && rect.width > 0;
      })
      .slice(0, 4)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
    const title = document.title;
    const text = document.body.innerText.slice(0, 400);
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      overflowing,
      title,
      text,
    };
  });

  const shotKey = `${label}:${path}@${width}`;
  if (SHOTS.has(shotKey)) {
    const name = `shots/${label}${path.replace(/\//g, "_")}@${width}.png`;
    await page.screenshot({ path: name });
  }

  const horizontal = metrics.scrollWidth > metrics.clientWidth + 2;
  if (horizontal) problems.push(`${shotKey}: horizontal overflow (${metrics.scrollWidth} > ${metrics.clientWidth})`);
  if (consoleErrors.length) problems.push(`${shotKey}: console -> ${consoleErrors.join(" | ")}`);
  if (!/CreditFlow/.test(metrics.title)) problems.push(`${shotKey}: bad title "${metrics.title}"`);
  if (metrics.text.trim().length < 40) problems.push(`${shotKey}: page looks empty`);

  results.push({ key: shotKey, title: metrics.title, horizontal, consoleErrors });
  await page.close();
}

const only = process.argv[2];

const loginContext = await browser.newContext();
if (!only || only === "login") {
  await visit(loginContext, "login", "/login", 390);
  await visit(loginContext, "login", "/login", 1440);
}
await loginContext.close();

for (const [label, paths] of Object.entries(PORTALS)) {
  if (only && only !== label) continue;
  const context = await browser.newContext();
  await context.addInitScript((value) => {
    window.localStorage.setItem("creditflow-session", value);
  }, SESSIONS[label]);
  for (const width of WIDTHS) {
    for (const path of paths) {
      await visit(context, label, path, width);
    }
  }
  await context.close();
}

await browser.close();

console.log(`checked ${results.length} pages`);
if (problems.length === 0) {
  console.log("NO_PROBLEMS");
} else {
  console.log(`PROBLEMS:${problems.length}`);
  for (const problem of problems) console.log(` - ${problem}`);
}
