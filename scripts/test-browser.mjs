import puppeteer from "puppeteer";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { FORMATS } from "../src/lib/formats.js";
const external = process.env.ATLAS_TEST_URL;
const base = external || "http://127.0.0.1:4175";
const server = external
  ? null
  : spawn(
      "npm",
      [
        "run",
        "dev",
        "--",
        "--host",
        "127.0.0.1",
        "--port",
        "4175",
        "--strictPort",
      ],
      { stdio: "ignore", detached: true },
    );
const downloads = await mkdtemp(path.join(tmpdir(), "atlas-tests-"));
let browser;
async function ready() {
  for (let i = 0; i < 150; i++) {
    try {
      const response = await fetch(`${base}/`);
      if (response.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Test server did not start");
}
try {
  await ready();
  browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.createCDPSession().then((session) =>
    session.send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloads,
    }),
  );
  const click = async (text) => {
    await page.evaluate((text) => {
      document
        .querySelectorAll("[data-atlas-test-control]")
        .forEach((e) => e.removeAttribute("data-atlas-test-control"));
      const el = [
        ...document.querySelectorAll('button,[role="menuitem"],a'),
      ].find(
        (e) =>
          e.textContent.trim() === text ||
          (e.getAttribute("role") === "menuitem" &&
            e.textContent.trim().startsWith(text)),
      );
      if (!el) throw new Error("Missing control: " + text);
      el.setAttribute("data-atlas-test-control", "true");
    }, text);
    await page.click("[data-atlas-test-control]");
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  };
  const route = async (route) => {
    await page.goto(`${base}/#${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main");
  };
  const preview = async () => {
    await page.waitForFunction(
      () =>
        document.body.textContent.includes("Preview ready") &&
        !document.body.textContent.includes("Preview needs attention"),
      { timeout: 20000 },
    );
    await page.waitForSelector(".mermaid-stage svg");
  };
  const source = async () => page.$eval(".cm-content", (e) => e.textContent);
  const fill = async (selector, value) => {
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type(selector, value);
  };
  async function replaceSource(value) {
    await page.click(".cm-content");
    const modifier = await page.evaluate(() =>
      /Mac/.test(navigator.platform) ? "Meta" : "Control",
    );
    await page.keyboard.down(modifier);
    await page.keyboard.press("a");
    await page.keyboard.up(modifier);
    await page.keyboard.sendCharacter(value);
  }
  await route("/studio");
  await page.waitForSelector(".cm-editor");
  await preview();
  assert.equal(
    await page.$$eval("[data-document-id]", (e) => e.length),
    1,
    "Opening studio must not create duplicate templates",
  );
  // Every registry sample is usable from the actual studio, not just a parser API.
  for (const format of FORMATS) {
    await page.click('[aria-label="New file"]');
    await page.waitForSelector("#new-format");
    await page.select("#new-format", format.id);
    await click("Create");
    await page.waitForFunction(
      (format) =>
        document.querySelector('[aria-label="Source format"]')?.value ===
        format.id,
      {},
      format,
    );
    await preview();
    assert((await source()).includes(format.sample.split("\n")[0]));
    console.log(`PASS browser preview: ${format.name}`);
  }
  // Preserve the original source, export it, and reopen persisted projects.
  await page.evaluate(async () => {
    const tab = [...document.querySelectorAll('[role="tab"]')].find(
      (e) => e.textContent === "untitled.sql",
    );
    tab.click();
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
  });
  await page.waitForFunction(() =>
    document.querySelector(".cm-content")?.textContent.includes("CREATE TABLE"),
  );
  await preview();
  await click("Export");
  await click("Original format source");
  for (let i = 0; i < 100; i++) {
    if ((await readdir(downloads)).includes("untitled.sql")) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.match(
    await readFile(path.join(downloads, "untitled.sql"), "utf8"),
    /CREATE TABLE/,
  );
  await click("File");
  await click("Download project backup");
  for (let i = 0; i < 100; i++) {
    if ((await readdir(downloads)).some((f) => f.endsWith(".atlas"))) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  const backupName = (await readdir(downloads)).find((f) =>
    f.endsWith(".atlas"),
  );
  const backup = JSON.parse(
    await readFile(path.join(downloads, backupName), "utf8"),
  );
  assert.equal(backup.project.documents.length, FORMATS.length + 1);
  await page.waitForFunction(() =>
    document.body.textContent.includes("Saved locally"),
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() =>
    document.querySelector(".cm-content")?.textContent.includes("CREATE TABLE"),
  );
  await preview();
  await page.click("[data-document-id]");
  await page.waitForFunction(() =>
    document.querySelector(".cm-content")?.textContent.startsWith("flowchart"),
  );
  await preview();
  await fill('[aria-label="New node label"]', "Audit service");
  await click("Add node");
  await page.waitForFunction(() =>
    document
      .querySelector(".cm-content")
      ?.textContent.includes("Audit service"),
  );
  await preview();
  assert(
    await page.$eval(".mermaid-stage", (e) =>
      e.textContent.includes("Audit service"),
    ),
  );
  await page.select('[aria-label="Connection from"]', "Client");
  await page.select('[aria-label="Connection to"]', "node1");
  await click("Connect nodes");
  await page.waitForFunction(() =>
    document
      .querySelector(".cm-content")
      ?.textContent.includes("Client --> node1"),
  );
  await preview();
  await click("History");
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent === "Save snapshot",
    ),
  );
  await click("Save snapshot");
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent === "Restore",
    ),
  );
  const validSvg = await page.$eval(".mermaid-stage", (e) => e.innerHTML);
  await replaceSource("flowchart TD\n A --> [broken");
  await page.waitForFunction(() =>
    document.body.textContent.includes("Preview needs attention"),
  );
  assert.equal(
    await page.$eval(".mermaid-stage", (e) => e.innerHTML),
    validSvg,
    "Invalid source must retain last valid diagram",
  );
  await click("Restore");
  await preview();
  for (const [label, extension] of [
    ["SVG vector", "svg"],
    ["PNG image · 2×", "png"],
    ["PDF document", "pdf"],
    ["Interactive HTML", "html"],
  ]) {
    await click("Export");
    await click(label);
    for (let i = 0; i < 100; i++) {
      if ((await readdir(downloads)).some((f) => f.endsWith("." + extension)))
        break;
      await new Promise((r) => setTimeout(r, 50));
    }
    const name = (await readdir(downloads)).find((f) =>
      f.endsWith("." + extension),
    );
    assert(name, `Missing ${extension} download`);
    const bytes = await readFile(path.join(downloads, name));
    if (extension === "svg") assert.match(bytes.toString(), /<svg/);
    if (extension === "png")
      assert.deepEqual(
        [...bytes.subarray(0, 8)],
        [137, 80, 78, 71, 13, 10, 26, 10],
      );
    if (extension === "pdf") assert.match(bytes.toString(), /^%PDF-/);
    if (extension === "html") assert.match(bytes.toString(), /<svg/);
  }
  // ZIP backups restore the full project, rather than importing duplicate sources.
  await click("File");
  await click("Download all files as ZIP");
  for (let i = 0; i < 100; i++) {
    if ((await readdir(downloads)).some((f) => f.endsWith(".zip"))) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  const zipName = (await readdir(downloads)).find((f) => f.endsWith(".zip"));
  const input = await page.$('input[type="file"]:not([webkitdirectory])');
  await input.uploadFile(path.join(downloads, zipName));
  await page.waitForFunction(() =>
    document.body.textContent.includes("including snapshots"),
  );
  await preview();
  assert.equal(
    await page.$$eval("[data-document-id]", (e) => e.length),
    FORMATS.length + 1,
  );
  await click("History");
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent === "Restore",
    ),
  );
  await click("Edit");
  await click("Find in file");
  await page.waitForSelector(".cm-search");
  await page.keyboard.press("Escape");
  // Router transitions keep current edits and query filters.
  await page.evaluate(() =>
    [...document.querySelectorAll("a")]
      .find((a) => a.textContent === "Projects")
      .click(),
  );
  await page.waitForFunction(
    () => document.querySelector("h1")?.textContent === "Projects",
  );
  assert(
    await page.evaluate(() =>
      document.body.textContent.includes("My first project"),
    ),
  );
  await route("/templates?q=erDiagram");
  await page.waitForSelector('[aria-label="Search templates"]');
  assert.equal(
    await page.$eval('[aria-label="Search templates"]', (e) => e.value),
    "erDiagram",
  );
  await page.click('a[href="#/studio?template=er-diagram"]');
  await preview();
  await page.goBack();
  await page.waitForSelector('[aria-label="Search templates"]');
  assert.equal(
    await page.$eval('[aria-label="Search templates"]', (e) => e.value),
    "erDiagram",
  );
  await route("/compare");
  await page.waitForFunction(() => location.hash === "#/formats");
  await route("/no-such-page");
  await page.waitForFunction(() => document.body.textContent.includes("404"));
  const modifier = await page.evaluate(() =>
    /Mac/.test(navigator.platform) ? "Meta" : "Control",
  );
  await page.keyboard.down(modifier);
  await page.keyboard.press("k");
  await page.keyboard.up(modifier);
  await page.waitForSelector("dialog[open]");
  await page.keyboard.press("Escape");
  assert.equal(await page.$("dialog[open]"), null);
  await page.setViewport({ width: 390, height: 844 });
  for (const routeName of [
    "/",
    "/templates",
    "/saved",
    "/formats",
    "/studio",
  ]) {
    await route(routeName);
    if (routeName === "/studio") await preview();
    else await page.waitForSelector("h1");
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `No overflow on ${routeName}`,
    );
  }
  await page.click('[aria-label="Toggle explorer"]');
  await page.waitForSelector('[role="dialog"]');
  await page.keyboard.press("Escape");
  await page.click('[aria-label="Toggle inspector"]');
  await page.waitForSelector('[role="dialog"]');
  await page.keyboard.press("Escape");
  assert.deepEqual(errors, []);
  console.log(
    "PASS: native source and SVG/PNG/PDF/HTML downloads, project and ZIP backups, tabs and reload, visual nodes and connections, snapshots, error retention, search, routes, keyboard commands, all mobile pages and panels.",
  );
} finally {
  await browser?.close();
  if (server) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
  }
  await rm(downloads, { recursive: true, force: true });
}
