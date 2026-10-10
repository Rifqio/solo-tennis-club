import type { Message } from '@/i18n/types'

export interface ClubContent {
  name: string
  shortName: string
  city: string
  description: Message | null
  // Digits only, with the country code (62...), for a wa.me link.
  whatsapp: string | null
  instagram: string | null
  logoSrc: string | null
  photo: string
}

// Real content is club-supplied. The name and city are confirmed; the story and contacts stay null until the club
// provides them, and the screen leaves those parts out instead of inventing them.
export const clubContent: ClubContent = {
  name: 'Solo Tennis Club',
  shortName: 'STC',
  city: 'Surakarta',
  description: null,
  whatsapp: null,
  instagram: null,
  logoSrc: null,
  // Generic licensed photography (public/photos/court-net.webp.json) until the club sends its own.
  photo: '/photos/court-net.webp',
}
