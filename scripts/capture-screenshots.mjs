import puppeteer from "puppeteer";
import { mkdir } from "node:fs/promises";

const base = process.env.ATLAS_TEST_URL || "http://127.0.0.1:5173";
const output = new URL("../screenshots/enterprise/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [size, viewport] of [
    ["desktop", { width: 1440, height: 1000 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    await page.setViewport(viewport);
    for (const [name, route] of [
      ["home", "/"],
      ["templates", "/templates"],
      ["projects", "/saved"],
      ["formats", "/formats"],
      ["studio", "/studio"],
      ["not-found", "/unknown"],
    ]) {
      await page.goto(`${base}/#${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("main");
      if (name === "home")
        await page.waitForSelector(".marketing-diagram svg", {
          timeout: 20000,
        });
      else if (name === "studio")
        await page.waitForFunction(
          () => document.body.textContent.includes("Preview ready"),
          { timeout: 20000 },
        );
      else await page.waitForSelector("h1");
      await page.evaluate(() => document.fonts.ready);
      await new Promise((r) => setTimeout(r, 500));
      await page.screenshot({
        path: new URL(`${size}-${name}.png`, output).pathname,
        fullPage: name !== "studio",
      });
      console.log(`Captured ${size} ${name}`);
    }
  }
  if (errors.length) throw new Error(errors.join("\n"));
} finally {
  await browser.close();
}
