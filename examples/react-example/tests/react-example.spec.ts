import { expect, test } from '@playwright/test';

test.describe('react example', () => {
  test('visit home page', async ({ page }) => {
    await page.goto('/');
    const title = page.locator('text=Welcome to Example For Fun');
    await expect(title).toBeVisible();
  });

  test('mdx import components should work', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=0')).toBeVisible();
    await page.click('text=add');
    await expect(page.locator('text=1')).toBeVisible();
    await page.click('text=minus');
    await expect(page.locator('text=0')).toBeVisible();
  });

  test('should be able to navigate to component page', async ({ page }) => {
    await page.goto('/');

    await page.click('text=Button');

    await expect(page.locator('h1')).toHaveText('Button');
  });

  test('console panel should work', async ({ page }) => {
    await page.goto('/core/button');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const frames = page.frames();

    const lastFrame = frames[frames.length - 1];

    await lastFrame.click('button:has-text("Info Multiple")');
    await lastFrame.click('button:has-text("Warn")');

    // somehow the console is flaky

    // await page.click('text=Console (2)');

    // await expect(
    //   page.locator(`text=(2) {'React' => 'react', 'Angular' => 'ng'}`)
    // ).toBeVisible();
  });

  test('standalone view should work', async ({ page }) => {
    await page.goto('/form-control/textarea');

    await page.click('data-testid=standalone-link');

    await expect(page.locator('data-testid=comment-toggle')).toBeVisible();

    await page.click('data-testid=comment-toggle');
    await page.click('data-testid=setting-menu');
    await page.click('text=Sync Interactions');

    const frames = page.frames();

    const lastFrame = frames[frames.length - 1];

    await lastFrame.type('textarea', 'Hello');

    const last2Frame = frames[frames.length - 2];

    await expect(lastFrame.locator('textarea:visible')).toHaveValue(
      'Hellotextarea'
    );
    await expect(last2Frame.locator('textarea:visible')).toHaveValue(
      'Hellotextarea'
    );
  });
});
