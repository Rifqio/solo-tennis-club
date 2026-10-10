import type { CustomerSessionResponse, OtpChallengeResponse } from '../../shared/api/customer-auth.ts'

function cookieHeader(response: Response) {
  return response.headers.getSetCookie().filter(cookie => !cookie.includes('Max-Age=0')).map(cookie => cookie.split(';')[0]).join('; ')
}

// Signs a new customer up through the mock OTP flow and returns their session cookie and id.
export async function registerCustomer(baseUrl: string, phone: string, name = 'Contoh Pelanggan') {
  const send = (path: string, body: unknown, cookie = '', csrfToken = '') => fetch(baseUrl + '/api/customer/auth/' + path, {
    method: 'POST',
    headers: { Origin: baseUrl, 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(body),
  })
  const request = await send('otp-challenges', { phone })
  const challenge = await request.json() as OtpChallengeResponse
  const flowCookie = cookieHeader(request)
  const verified = await send('otp-verifications', { challengeId: challenge.challengeId, code: challenge.debugCode }, flowCookie)
  const proof = await verified.json() as { csrfToken: string }
  const completed = await send('profile', { name }, flowCookie + '; ' + cookieHeader(verified), proof.csrfToken)
  if (completed.status !== 201) throw new Error('Customer sign-up failed: ' + completed.status)
  const info = await completed.json() as CustomerSessionResponse
  return { cookie: cookieHeader(completed), customerId: info.customer.id, csrfToken: info.csrfToken }
}
