import { createCn } from 'cn/config'

// Teach the merger the design system's own text sizes and shadows. Without this it reads `text-label` as a color,
// so `cn('text-label text-on-surface', 'text-title')` would silently drop the color.
export const cn = createCn({
  extend: {
    classGroups: {
      'font-size': [{ text: ['label', 'body', 'title', 'headline', 'numeral', 'display'] }],
      shadow: [{ shadow: ['menu', 'bar', 'sheet', 'fab'] }],
    },
  },
})
