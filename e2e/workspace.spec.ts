import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { makeFixture } from "../src/core/fixture";
import { parseFnt } from "../src/core/fnt";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const font1 = Buffer.from(makeFixture());
const font2 = Buffer.from(
  makeFixture({ width: 512, height: 512, sentinels: 3, colored: true }),
);
const inputFile = (name: string, buffer = font1) => ({
  name,
  mimeType: "application/octet-stream",
  buffer,
});
async function loadBoth(page: Page) {
  await page.goto("/");
  await page
    .locator("#fileInput")
    .setInputFiles([inputFile("FONT1.FNT"), inputFile("FONT2.FNT", font2)]);
  await expect(page.locator(".font-tab")).toHaveCount(2);
}
async function chooseA(page: Page) {
  await page.getByRole("searchbox", { name: "Find a glyph" }).fill("U+0041");
  await page.locator("[data-glyph]").first().click();
}

test("empty state, accessible import alternative, original demo, and responsive layout", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "TT Font Studio" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Choose FNT files" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/empty-desktop.png",
    fullPage: true,
  });
  await expect(
    new AxeBuilder({ page }).analyze().then((r) => r.violations),
  ).resolves.toEqual([]);
  await page.getByRole("button", { name: "Explore a demo font" }).click();
  await expect(page.locator("#preview-en")).toBeVisible();
  await expect(page.locator("#preview-uk")).toBeVisible();
  await page.screenshot({
    path: "test-results/demo-desktop.png",
    fullPage: true,
  });
  await expect(
    new AxeBuilder({ page }).analyze().then((r) => r.violations),
  ).resolves.toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/demo-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("loads both fonts, edits shared metrics, retains state across tabs, and undoes", async ({
  page,
}) => {
  await loadBoth(page);
  await chooseA(page);
  const width = page.getByLabel("Width / advance", { exact: true });
  await width.fill("8.25");
  await width.press("Tab");
  await expect(page.getByLabel("Width / advance", { exact: true })).toHaveValue(
    "8.25",
  );
  await expect(page.locator(".dirty")).toHaveCount(1);
  await page.locator("[data-font]").filter({ hasText: "FONT1.FNT" }).click();
  await chooseA(page);
  await expect(page.getByLabel("Width / advance", { exact: true })).toHaveValue(
    "11",
  );
  await page.locator("[data-font]").filter({ hasText: "FONT2.FNT" }).click();
  await expect(page.getByLabel("Width / advance", { exact: true })).toHaveValue(
    "8.25",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByLabel("Width / advance", { exact: true })).toHaveValue(
    "11",
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(page.getByLabel("Width / advance", { exact: true })).toHaveValue(
    "8.25",
  );
  await page.locator("#text-en").fill("Hello A");
  await page.locator("#text-uk").fill("Україна Ґґ Її Єє Іі");
  await expect(page.locator("#missing-en")).toHaveText(
    "All characters available",
  );
  await expect(page.locator("#missing-uk")).toHaveText(
    "All characters available",
  );
  await page.locator("#text-uk").fill("Україна 🧩");
  await expect(page.locator("#missing-uk")).toContainText("🧩");
  await page.getByLabel("Width / advance", { exact: true }).fill("-1");
  await page.getByLabel("Width / advance", { exact: true }).press("Tab");
  await expect(page.getByRole("alert")).toContainText("inside the atlas");
  await page.screenshot({
    path: "test-results/validation-error.png",
    fullPage: true,
  });
});

test("drag and drop imports two resources; malformed input preserves open fonts", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    ({ a, b }) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([new Uint8Array(a)], "DROP1.FNT"));
      transfer.items.add(new File([new Uint8Array(b)], "DROP2.FNT"));
      document.dispatchEvent(
        new DragEvent("dragenter", { dataTransfer: transfer, bubbles: true }),
      );
      document.dispatchEvent(
        new DragEvent("drop", { dataTransfer: transfer, bubbles: true }),
      );
    },
    { a: [...font1], b: [...font2] },
  );
  await expect(page.locator(".font-tab")).toHaveCount(2);
  await page
    .locator("#fileInput")
    .setInputFiles(inputFile("BROKEN.FNT", Buffer.from([1, 2, 3])));
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator(".font-tab")).toHaveCount(2);
  await page.locator("#search").fill("nonexistent");
  await expect(page.getByText("No matching glyphs.")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator("[data-glyph]").first()).toBeVisible();
});

test("downloads byte-identical untouched FNT and edited valid FNT, PNG and JSON", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#fileInput").setInputFiles(inputFile("ORIGINAL.FNT"));
  await expect(page.locator(".font-tab")).toHaveCount(1);
  let downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export FNT", exact: true }).click();
  let download = await downloadPromise;
  expect(readFileSync((await download.path())!).equals(font1)).toBe(true);
  await chooseA(page);
  await page.getByLabel("Width / advance", { exact: true }).fill("8");
  await page.getByLabel("Width / advance", { exact: true }).press("Tab");
  downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export FNT", exact: true }).click();
  download = await downloadPromise;
  const parsed = parseFnt(
    new Uint8Array(readFileSync((await download.path())!)),
  );
  expect(
    parsed.metrics[parsed.mapping.find((m) => m.codepoint === 65)!.glyphIndex]
      .width,
  ).toBe(8);
  await expect(page.locator(".dirty")).toHaveCount(0);
  await page.getByText("Font actions", { exact: true }).click();
  downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export metrics JSON" }).click();
  download = await downloadPromise;
  expect(
    JSON.parse(readFileSync((await download.path())!, "utf8")).schemaVersion,
  ).toBe(1);
  downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export atlas PNG" }).click();
  download = await downloadPromise;
  expect([...readFileSync((await download.path())!).subarray(0, 4)]).toEqual([
    137, 80, 78, 71,
  ]);
});

test("replaces atlas pixels and exports worker-encoded DDS with undo recovery", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#fileInput").setInputFiles(inputFile("TEXTURE.FNT"));
  await page.getByText("Font actions", { exact: true }).click();
  const png = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 256, 256);
    return canvas.toDataURL();
  });
  await page.locator("#pngInput").setInputFiles({
    name: "replacement.png",
    mimeType: "image/png",
    buffer: Buffer.from(png.split(",")[1], "base64"),
  });
  await expect(
    page.getByText("Replacement atlas", { exact: true }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export FNT", exact: true }).click();
  const download = await downloadPromise,
    parsed = parseFnt(new Uint8Array(readFileSync((await download.path())!)));
  const doc = await import("../src/core/document").then(
    (m) => new m.FontDocument(parsed),
  );
  expect([...doc.rgba.slice(0, 4)]).toEqual([255, 0, 0, 255]);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByText("Replacement atlas", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".dirty")).toHaveCount(1);
});

test("keyboard import/edit navigation and confirmation protect unsaved work", async ({
  page,
}) => {
  await loadBoth(page);
  await chooseA(page);
  await page.getByLabel("Width / advance", { exact: true }).fill("8");
  await page.getByLabel("Width / advance", { exact: true }).press("Tab");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "Close FONT2.FNT", exact: true })
    .click();
  await expect(page.locator(".font-tab")).toHaveCount(2);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Close FONT2.FNT", exact: true })
    .click();
  await expect(page.locator(".font-tab")).toHaveCount(1);
});

const privateDir = process.env.TT_PRIVATE_FIXTURES;
test("private Font 1 and Font 2 render both languages", async ({ page }) => {
  test.skip(!privateDir || !existsSync(join(privateDir, "FONT1.FNT")));
  await page.goto("/");
  await page
    .locator("#fileInput")
    .setInputFiles([
      join(privateDir!, "FONT1.FNT"),
      join(privateDir!, "FONT2.FNT"),
    ]);
  await expect(page.locator(".font-tab")).toHaveCount(2);
  for (const name of ["FONT1.FNT", "FONT2.FNT"]) {
    await page.locator("[data-font]").filter({ hasText: name }).click();
    await expect(page.locator("#preview-en")).toBeVisible();
    await expect(page.locator("#preview-uk")).toBeVisible();
    await expect(page.locator("#missing-uk")).toHaveText(
      "All characters available",
    );
    await chooseA(page);
    await page.screenshot({
      path: `test-results/private-${name}.png`,
      fullPage: true,
    });
    const raster = await page
      .locator("#preview-uk")
      .evaluate((canvas: HTMLCanvasElement) =>
        canvas
          .getContext("2d")!
          .getImageData(0, 0, canvas.width, canvas.height)
          .data.some((v, i, arr) => i % 4 === 0 && v !== arr[0]),
      );
    expect(raster).toBe(true);
  }
});

test("numeric stepping retains focus and Tab advances to the next field", async ({
  page,
}) => {
  await loadBoth(page);
  await chooseA(page);
  const width = page.getByLabel("Width / advance", { exact: true });
  await width.focus();
  await page.keyboard.press("ArrowUp");
  await expect(width).toHaveValue("11.25");
  await expect(width).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(width).toHaveValue("11.5");
  await expect(width).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(width).toHaveValue("11.25");
  await expect(width).toBeFocused();
  const x = page.getByLabel("X position", { exact: true });
  await x.focus();
  await page.keyboard.press("ArrowUp");
  await expect(x).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Y position", { exact: true })).toBeFocused();
  await page.getByText("Shared font metrics", { exact: true }).click();
  const baseline = page.getByLabel("Baseline", { exact: true });
  await baseline.focus();
  await page.keyboard.press("ArrowDown");
  await expect(baseline).toHaveValue("10.75");
  await expect(baseline).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(baseline).toHaveValue("10.5");
  await expect(baseline).toBeFocused();
});
