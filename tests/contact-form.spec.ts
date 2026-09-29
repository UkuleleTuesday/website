import { test, expect } from '@playwright/test';

// The contact form on Book Us and Contact Us has no Subject field: the
// hidden "subject" field that titles Netlify's notification email is
// filled in from the enquiry type and the sender's name.
const pages = [
  { path: '/book-us/', enquiryType: 'A festival or gig' },
  { path: '/contact-us/', enquiryType: 'Performance booking' },
];

for (const { path, enquiryType } of pages) {
  test.describe(`contact form on ${path}`, () => {
    test('asks for no subject line', async ({ page }) => {
      await page.goto(path);
      const form = page.locator('form#contact');
      await expect(form.getByLabel('Subject')).toHaveCount(0);
      await expect(form.locator('input[name="subject"]')).toHaveAttribute('type', 'hidden');
    });

    test('titles the notification email with the enquiry type and name', async ({ page }) => {
      await page.goto(path);

      // Netlify handles the POST in production; the test server can't.
      let posted: URLSearchParams | undefined;
      await page.route(`**${path}`, async route => {
        if (route.request().method() !== 'POST') return route.fallback();
        posted = new URLSearchParams(route.request().postData() ?? '');
        await route.fulfill({ status: 200, contentType: 'text/html', body: 'Thanks' });
      });

      const form = page.locator('form#contact');
      await form.getByLabel('Your name').fill('Jane Smith');
      await form.getByLabel('Your email').fill('jane@example.com');
      await form.getByLabel('What are you enquiring about?').selectOption(enquiryType);
      await form.getByLabel('Your message').fill('We would love you at our festival.');
      await form.getByRole('button', { name: 'Send' }).click();

      await expect.poll(() => posted?.get('subject')).toBe(`Website enquiry: ${enquiryType} from Jane Smith`);
      expect(posted?.get('enquiry-type')).toBe(enquiryType);
      expect(posted?.has('your-subject')).toBe(false);
    });
  });
}
