import type { Page } from '@playwright/test'

// Desktop (1024px and wider) shows a session's detail in the side panel beside the day's rows; narrower screens open
// it as a sheet.
export function sessionDetail(page: Page) {
  return (page.viewportSize()?.width ?? 0) >= 1024 ? page.getByRole('complementary').first() : page.getByRole('dialog')
}
