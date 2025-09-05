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
  } catch {}
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

export function setupFontNetworkLogging(page, collector) {
  page.on('request', req => {
    const url = req.url();
    if (/\.(woff2?|ttf|otf)(\?|$)/i.test(url) || /fonts\.googleapis|fonts\.gstatic/.test(url)) {
      collector.requests.push({ url, method: req.method(), state: 'requested', start: Date.now() });
    }
  });
  page.on('requestfinished', req => {
    const url = req.url();
    if (/\.(woff2?|ttf|otf)(\?|$)/i.test(url) || /fonts\.googleapis|fonts\.gstatic/.test(url)) {
      const entry = collector.requests.find(r => r.url === url && r.state === 'requested');
      if (entry) {
        entry.state = 'finished';
        entry.end = Date.now();
      }
    }
  });
  page.on('requestfailed', req => {
    const url = req.url();
    if (/\.(woff2?|ttf|otf)(\?|$)/i.test(url) || /fonts\.googleapis|fonts\.gstatic/.test(url)) {
      const entry = collector.requests.find(r => r.url === url && r.state === 'requested');
        if (entry) {
          entry.state = 'failed';
          entry.error = req.failure();
          entry.end = Date.now();
        } else {
          collector.requests.push({ url, method: req.method(), state: 'failed', error: req.failure(), end: Date.now() });
        }
    }
  });
}
