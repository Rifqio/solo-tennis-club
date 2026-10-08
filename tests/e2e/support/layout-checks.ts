/// <reference lib="dom" />
import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export const LAYOUT_WIDTHS = [320, 390, 640, 820, 1024, 1440] as const

export async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
  expect(scrollWidth, 'page must not scroll sideways').toBeLessThanOrEqual(innerWidth)
}

export async function expectTouchTargets(page: Page, selector = 'a, button, input, select, [role=button]') {
  const undersized = await page.locator(selector).evaluateAll(elements => elements.flatMap(element => {
    const box = element.getBoundingClientRect()
    if (box.width === 0 && box.height === 0) return []
    const tooShort = box.height < 48
    const tooNarrow = element.hasAttribute('data-icon-only') && box.width < 48
    return tooShort || tooNarrow ? [`${element.tagName.toLowerCase()} "${element.textContent?.trim() ?? ''}" ${Math.round(box.width)}x${Math.round(box.height)}`] : []
  }))
  expect(undersized, 'every visible control is at least 48px').toEqual([])
}
