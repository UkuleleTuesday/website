import { Page } from '@playwright/test';

/**
 * Records the browser-console problems attributable to our own code and
 * assets while a page is exercised: console.error output, uncaught exceptions
 * and failed requests to our origin. Errors logged by or about resources on
 * other origins (for example a blocked third-party stylesheet) are ignored.
 *
 * Call it before navigating; the returned array fills up as problems occur.
 */
export function collectConsoleProblems(page: Page, origin: string): string[] {
  const problems: string[] = [];
  const isOurs = (address: string) => new URL(address, origin).origin === origin;
  const mentionsOnlyOtherOrigins = (text: string) => {
    const urls = text.match(/https?:\/\/[^\s"')]+/g) ?? [];
    return urls.length > 0 && urls.every((address) => !isOurs(address));
  };

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const location = message.location().url;
    if (location && !isOurs(location)) return;
    if (!location && mentionsOnlyOtherOrigins(message.text())) return;
    problems.push(`console error: ${message.text()}${location ? ` (${location})` : ''}`);
  });
  page.on('pageerror', (error) => {
    problems.push(`uncaught exception: ${error.message}`);
  });
  page.on('response', (response) => {
    if (isOurs(response.url()) && response.status() >= 400) {
      problems.push(`HTTP ${response.status()} for ${response.url()}`);
    }
  });

  return problems;
}
