import type { OtpChallengeResponse } from './customer-auth.ts'

// GET /api/customer/account (boards 9e and D11): who is signed in, and two counts from their own bookings.
export interface CustomerAccountResponse {
  // The signed-in session's token for the account's writes (rename, phone change, sign-out).
  csrfToken?: string
  customer: { displayName: string; phone: string; verifiedAt: string }
  stats: {
    // Paid bookings for sessions already played (cancelled sessions not counted).
    sessionsPlayed: number
    // Upcoming bookings that still hold places: paid, under review, or unpaid before their deadline.
    activeBookings: number
  }
}

// PUT /api/customer/account/name. Past bookings keep the name they were made under.
export interface CustomerNameRequest { displayName: string }

// POST /api/customer/account/phone-challenges sends a code to the new number (same limits as sign-in);
// POST /api/customer/account/phone-verifications with that code moves the account to it. A number already used by
// another account is refused only after its code is confirmed, so nobody can probe which numbers are members.
export interface CustomerPhoneChangeRequest { phone: string }
export type CustomerPhoneChallengeResponse = OtpChallengeResponse
export interface CustomerPhoneVerifyRequest { challengeId: string; code: string }
