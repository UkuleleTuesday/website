import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Get the list of template files from build.py
const templateFilesJson = execSync('uv run python -c "import build; import json; print(json.dumps(build.build()))"', { encoding: 'utf-8' });
const templateFiles: string[] = JSON.parse(templateFilesJson);

const publicDir = path.join(__dirname, '..', 'public');

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
