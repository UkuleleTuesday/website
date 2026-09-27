import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(__dirname, '..', '..', 'templates');

/**
 * Every page of the site as its URL path ("/", "/concerts/", ...), derived
 * from the templates directory the same way build.py lays out public/.
 * Partials, layouts and macros (names starting with "_") are skipped.
 */
export function getAllPageUrls(): string[] {
  const urls: string[] = [];

  function walk(dir: string, relativeDir: string) {
    for (const entry of fs.readdirSync(dir)) {
      if (entry.startsWith('_') || entry.startsWith('.')) continue;
      const fullPath = path.join(dir, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath, path.posix.join(relativeDir, entry));
      } else if (entry === 'index.html') {
        urls.push(relativeDir === '' ? '/' : `/${relativeDir}/`);
      } else if (entry.endsWith('.html')) {
        urls.push(`/${path.posix.join(relativeDir, entry)}`);
      }
    }
  }

  walk(templatesDir, '');
  return urls.sort();
}
