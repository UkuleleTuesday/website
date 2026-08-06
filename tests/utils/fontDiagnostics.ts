export async function waitForFonts(page, opts: { timeoutMs?: number } = {}) {
  const timeout = opts.timeoutMs ?? 8000;
  const start = Date.now();
  let lastPending = -1;
  while (Date.now() - start < timeout) {
    const pending = await page.evaluate(() => {
      const fontFaces = Array.from(document.fonts);
      const loading = fontFaces.filter(f => f.status === 'loading').length;
      return loading;
    });
    if (pending === 0 && lastPending === 0) break;
    lastPending = pending;
    await page.waitForTimeout(150);
  }
  try {
    await page.evaluate(async () => { await document.fonts.ready; });
  } catch (e) {
    console.warn(`document.fonts.ready promise rejected: ${e.message}`);
  }
  const fontStatus = await page.evaluate(() => {
    const fontFaces = Array.from(document.fonts).map(f => ({
      family: f.family,
      status: f.status,
      weight: (f as any).weight,
      style: (f as any).style
    }));
    return { fontFaces };
  });
  return fontStatus;
}
