import type { Message } from '@/i18n/types'

export interface ClubContent {
  name: string
  shortName: string
  description: Message | null
  contact: Message | null
  address: Message | null
  logoSrc: string | null
  photos: string[]
}

// Real content is club-supplied. Only the confirmed name exists so far; everything else stays null until the club provides bilingual text and media.
export const clubContent: ClubContent = {
  name: 'Lawu Fun Tennis Club',
  shortName: 'Lafu',
  description: null,
  contact: null,
  address: null,
  logoSrc: null,
  photos: [],
}
