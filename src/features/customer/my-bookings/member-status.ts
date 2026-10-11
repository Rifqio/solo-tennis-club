import { effectiveBookingStatus } from '@shared/booking-rules'
import type { Message } from '@/i18n/types'
import { myBookingsMessages as messages } from './my-bookings.messages'

// How a member's booking reads in Booking kamu: still to pay (or to fix) before the deadline, waiting for the admin,
// paid, or over. The chip's colour always comes with these words (G1).
export type MemberStatus = 'unpaid' | 'correction' | 'review' | 'paid' | 'lapsed'

export function memberStatus(status: string, originalDeadline: string, now: number): MemberStatus {
  const effective = effectiveBookingStatus(status, new Date(originalDeadline), new Date(now))
  return effective === 'awaiting_payment' ? 'unpaid' : effective === 'needs_correction' ? 'correction'
    : effective === 'awaiting_verification' ? 'review' : effective === 'confirmed' ? 'paid' : 'lapsed'
}

export const memberStatusLabel: Record<MemberStatus, Message> = {
  unpaid: messages.unpaid, correction: messages.correction, review: messages.review, paid: messages.paid, lapsed: messages.lapsed,
}

// Still something for the member to do before the deadline.
export const owesPayment = (state: MemberStatus) => state === 'unpaid' || state === 'correction'
