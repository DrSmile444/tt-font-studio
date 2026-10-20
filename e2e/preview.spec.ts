import { test, expect } from "@playwright/test";
import { makeFixture } from "../src/core/fixture";
import { parseFnt } from "../src/core/fnt";
import { readFileSync } from "node:fs";

const bytes = makeFixture({ width: 1024, height: 1024 });
const font = parseFnt(bytes),
  view = new DataView(bytes.buffer);
const q = font.mapping.find((m) => m.codepoint === 81)!;
view.setFloat32(font.metricsOffset + q.glyphIndex * 12, 940, true);
view.setFloat32(font.metricsOffset + q.glyphIndex * 12 + 4, 900, true);
const file = {
  name: "LARGE.FNT",
  mimeType: "application/octet-stream",
  buffer: Buffer.from(bytes),
};

test("native defaults, explicit fit, and selection scroll only the atlas", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#fileInput").setInputFiles(file);
  await expect(page.getByLabel("Atlas zoom", { exact: true })).toHaveValue("1");
  await expect(page.getByLabel("Text scale", { exact: true })).toHaveValue("1");
  await expect(page.getByLabel("Text rendering", { exact: true })).toHaveValue(
    "smooth",
  );
  const pageY = await page.evaluate(() => scrollY);
  await page.getByRole("searchbox", { name: "Find a glyph" }).fill("U+0051");
  await page.locator("[data-glyph]").click();
  const geometry = await page.locator("#atlasViewport").evaluate((port) => {
    const p = port.getBoundingClientRect(),
      b = document.querySelector(".selected-bound")!.getBoundingClientRect();
    return {
      x: port.scrollLeft,
      y: port.scrollTop,
      inside:
        b.left >= p.left &&
        b.right <= p.left + port.clientWidth &&
        b.top >= p.top &&
        b.bottom <= p.top + port.clientHeight,
    };
  });
  expect(geometry.x).toBeGreaterThan(0);
  expect(geometry.y).toBeGreaterThan(0);
  expect(geometry.inside).toBe(true);
  expect(await page.evaluate(() => scrollY)).toBe(pageY);
  await expect(page.getByLabel("Atlas zoom", { exact: true })).toHaveValue("1");
  await page.locator("[data-glyph]").click();
  expect(
    await page
      .locator("#atlasViewport")
      .evaluate((port) => [port.scrollLeft, port.scrollTop]),
  ).toEqual([geometry.x, geometry.y]);
  await page.getByRole("button", { name: "Fit", exact: true }).click();
  expect(Number(await page.locator("#zoom").inputValue())).toBeLessThan(1);
  const fitted = await page.locator("#zoom").inputValue();
  await page
    .locator("#fileInput")
    .setInputFiles({
      name: "BROKEN.FNT",
      mimeType: "application/octet-stream",
      buffer: Buffer.from([1, 2, 3]),
    });
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator("#zoom")).toHaveValue(fitted);

  await page
    .locator("#fileInput")
    .setInputFiles({ ...file, name: "SECOND.FNT" });
  await expect(page.locator(".font-tab")).toHaveCount(2);
  await expect(page.locator("#zoom")).toHaveValue("1");
});

test("atlas backgrounds persist and do not enter PNG or FNT exports", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#fileInput").setInputFiles(file);
  const group = page.getByRole("group", {
    name: "Atlas background",
    exact: true,
  });
  await expect(
    group.getByRole("button", { name: "Transparency", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const originalPng = await page
    .locator("#atlasCanvas")
    .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await group.getByRole("button", { name: "Green", exact: true }).click();
  await expect(page.locator("#atlasStage")).toHaveCSS(
    "background-color",
    "rgb(0, 128, 0)",
  );
  await group.getByRole("button", { name: "White", exact: true }).click();
  await expect(page.locator("#atlasStage")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(page.locator("#atlasStage")).toHaveCSS(
    "background-image",
    "none",
  );
  await page.getByRole("searchbox", { name: "Find a glyph" }).fill("U+0041");
  await page.locator("[data-glyph]").click();
  await expect(
    group.getByRole("button", { name: "White", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page
      .locator("#atlasCanvas")
      .evaluate(
        (canvas: HTMLCanvasElement, original) =>
          canvas.toDataURL() === original,
        originalPng,
      ),
  ).toBe(true);
  await expect(page.locator(".dirty")).toHaveCount(0);
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export FNT", exact: true }).click();
  const download = await pending;
  expect(
    readFileSync((await download.path())!).equals(Buffer.from(bytes)),
  ).toBe(true);
  await page
    .locator("#fileInput")
    .setInputFiles({ ...file, name: "SECOND.FNT" });
  await expect(page.locator(".font-tab")).toHaveCount(2);
  await expect(
    group.getByRole("button", { name: "White", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await group
    .getByRole("button", { name: "Transparency", exact: true })
    .click();
  expect(
    await page
      .locator("#atlasStage")
      .evaluate((stage) => getComputedStyle(stage).backgroundImage),
  ).toContain("conic-gradient");
});

test("both preview modes use HiDPI backing pixels without changing CSS size", async ({
  browser,
}) => {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 1440, height: 1050 },
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.locator("#fileInput").setInputFiles(file);
  await page.locator("#textScale").selectOption("1.5");
  for (const lang of ["en", "uk"]) {
    const properties = await page
      .locator("#preview-" + lang)
      .evaluate((canvas: HTMLCanvasElement) => ({
        width: canvas.width,
        height: canvas.height,
        cssWidth: parseFloat(canvas.style.width),
        cssHeight: parseFloat(canvas.style.height),
        smoothing: canvas.getContext("2d")!.imageSmoothingEnabled,
        pixels: canvas.width * canvas.height,
      }));
    expect(properties.width).toBe(properties.cssWidth * 2);
    expect(properties.height).toBe(properties.cssHeight * 2);
    expect(properties.smoothing).toBe(true);
    expect(properties.pixels).toBeLessThanOrEqual(8_000_000);
  }
  const before = await page
    .locator("#preview-en")
    .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.locator("#previewRendering").selectOption("pixel");
  for (const lang of ["en", "uk"]) {
    expect(
      await page
        .locator("#preview-" + lang)
        .evaluate(
          (canvas: HTMLCanvasElement) =>
            canvas.getContext("2d")!.imageSmoothingEnabled,
        ),
    ).toBe(false);
    await expect(page.locator("#preview-" + lang)).toHaveCSS(
      "image-rendering",
      "pixelated",
    );
  }
  expect(
    await page
      .locator("#preview-en")
      .evaluate(
        (canvas: HTMLCanvasElement, original) =>
          canvas.toDataURL() === original,
        before,
      ),
  ).toBe(false);
  await page.locator("#previewRendering").selectOption("smooth");
  expect(
    await page
      .locator("#preview-en")
      .evaluate(
        (canvas: HTMLCanvasElement, original) =>
          canvas.toDataURL() === original,
        before,
      ),
  ).toBe(true);
  await page.locator("#textScale").selectOption("3");
  await page
    .locator("#text-en")
    .fill(Array(20).fill("A".repeat(190)).join("\n"));
  expect(
    await page
      .locator("#preview-en")
      .evaluate((canvas: HTMLCanvasElement) => canvas.width * canvas.height),
  ).toBeLessThanOrEqual(8_000_000);
  await page.screenshot({
    path: "test-results/preview-hidpi.png",
    fullPage: true,
  });
  await context.close();
});
