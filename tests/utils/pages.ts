import * as fs from 'fs';
import * as path from 'path';

/** The Jinja templates that build.py renders into public/. */
export const templatesDir = path.join(__dirname, '..', '..', 'templates');

/**
 * Lists the page templates under dirPath, relative to it ('index.html',
 * 'concerts/index.html', ...), skipping partials, layouts and macros (names
 * starting with '_'). build.py keeps the same layout under public/, so the
 * paths double as URL paths for page.goto().
 */
export function getAllHtmlFiles(dirPath: string, arrayOfFiles: string[] = [], relativeDir: string = ''): string[] {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        if (file.startsWith('_') || file.startsWith('.')) continue;
        const currentRelativePath = path.join(relativeDir, file);
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllHtmlFiles(fullPath, arrayOfFiles, currentRelativePath);
        } else if (file.endsWith('.html')) {
            arrayOfFiles.push(currentRelativePath);
        }
    }
    return arrayOfFiles;
}
