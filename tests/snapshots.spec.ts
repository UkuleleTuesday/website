import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(__dirname, '..', 'templates');
const publicDir = path.join(__dirname, '..', 'public');

function getAllHtmlFiles(dirPath: string, arrayOfFiles: string[] = [], relativeDir: string = ''): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach(function(file) {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllHtmlFiles(filePath, arrayOfFiles, path.join(relativeDir, file));
    } else {
        const fileName = path.basename(file);
        if (fileName.endsWith('.html') && !fileName.startsWith('_') && !fileName.startsWith('.')) {
            arrayOfFiles.push(path.join(relativeDir, file));
        }
    }
  });

  return arrayOfFiles;
}

const templateFiles = getAllHtmlFiles(templatesDir);

for (const templateFile of templateFiles) {
    test(`visual regression for ${templateFile}`, async ({ page }) => {
        const filePath = path.join(publicDir, templateFile);
        // Make sure the file exists before trying to navigate
        if (!fs.existsSync(filePath)) {
            // Log a warning and skip the test if the file doesn't exist.
            console.warn(`Warning: HTML file not found for template: ${templateFile} at path ${filePath}`);
            test.skip();
            return;
        }

        await page.goto(`file://${filePath}`);
        await expect(page).toHaveScreenshot(`${templateFile}.png`);
    });
}
