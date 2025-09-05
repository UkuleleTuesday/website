import { Page } from '@playwright/test';

/**
 * Utility function to force all elements into their hover state for visual regression testing.
 * This works by:
 * 1. Disabling animations/transitions for stable screenshots
 * 2. Cloning all :hover CSS rules to [data-force-hover] selectors
 * 3. Adding data-force-hover attribute to all elements
 * 4. Triggering inline onmouseenter handlers for elements that have them
 * 5. Running the provided function (usually taking a screenshot)
 * 6. Cleaning up the modifications
 */
export async function withAllHoverStates(page: Page, fn: () => Promise<void>) {
  // Kill animations/transitions for stable VRT
  await page.addStyleTag({ 
    content: `
      /* Kill animations/transitions for stable VRT */
      * {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `
  });

  // Inject a stylesheet that clones :hover rules => [data-force-hover]
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.id = 'force-hover-style';
    document.head.appendChild(style);

    // Helper: safely append CSS text to our <style>
    const append = (css: string) => {
      try {
        style.sheet?.insertRule(css);
      } catch (e) {
        // Ignore bad selectors/rules
        console.debug('Failed to insert CSS rule:', css, e);
      }
    };

    // Walk stylesheets, skip cross-origin
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        // Accessing .cssRules may throw on cross-origin
        rules = sheet.cssRules as CSSRuleList;
      } catch {
        continue;
      }
      
      for (const rule of Array.from(rules)) {
        // Only clone style rules that contain :hover
        if ((rule as CSSStyleRule).selectorText?.includes(':hover')) {
          const cssRule = rule as CSSStyleRule;
          const clonedSelector = cssRule.selectorText.replaceAll(/:hover/g, '[data-force-hover]');
          // Compose a new rule with identical declarations
          const cssText = `${clonedSelector}{${cssRule.style.cssText}}`;
          append(cssText);
        } else if (rule instanceof CSSMediaRule) {
          // Handle @media blocks by cloning inner :hover rules
          const media = rule as CSSMediaRule;
          const inner: string[] = [];
          for (const r of Array.from(media.cssRules)) {
            if ((r as CSSStyleRule).selectorText?.includes(':hover')) {
              const sr = r as CSSStyleRule;
              const sel = sr.selectorText.replaceAll(/:hover/g, '[data-force-hover]');
              inner.push(`${sel}{${sr.style.cssText}}`);
            }
          }
          if (inner.length) {
            append(`@media ${media.conditionText}{${inner.join('')}}`);
          }
        }
      }
    }

    // Mark everything as "hovered"
    document.documentElement.setAttribute('data-force-hover', '');
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
      el.setAttribute('data-force-hover', '');
    }

    // Also trigger inline onmouseenter handlers for elements that have them
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('[onmouseenter]'))) {
      try {
        if (el.onmouseenter) {
          el.onmouseenter.call(el, new MouseEvent('mouseenter', { bubbles: true }));
        }
      } catch (e) {
        console.debug('Failed to trigger onmouseenter:', e);
      }
    }
  });

  try {
    await fn();
  } finally {
    // Cleanup
    await page.evaluate(() => {
      // Trigger onmouseleave handlers before cleanup
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('[onmouseleave]'))) {
        try {
          if (el.onmouseleave) {
            el.onmouseleave.call(el, new MouseEvent('mouseleave', { bubbles: true }));
          }
        } catch (e) {
          console.debug('Failed to trigger onmouseleave:', e);
        }
      }

      document.documentElement.removeAttribute('data-force-hover');
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-force-hover]'))) {
        el.removeAttribute('data-force-hover');
      }
      const s = document.getElementById('force-hover-style');
      s?.parentElement?.removeChild(s);
    });
  }
}