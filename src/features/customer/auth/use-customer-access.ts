import { useEffect, useRef, useState } from 'react'
import type { CustomerSessionResponse, OtpChallengeResponse, OtpVerificationResponse } from '@shared/api/customer-auth'
import type { ApiErrorBody } from '@shared/api/errors'
import { CustomerApiError, customerRequest } from '@/lib/customer-api'

type AccessState =
  | { stage: 'loading' | 'loadError' | 'phone' }
  | { stage: 'code'; challenge: OtpChallengeResponse; receivedAt: number }
  | { stage: 'name'; csrfToken: string; expiresAt: string }
  | { stage: 'complete'; session: CustomerSessionResponse }

export function useCustomerAccess() {
  const [state, setState] = useState<AccessState>({ stage: 'loading' })
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<ApiErrorBody['error'] | 'network' | null>(null)
  const [retryAt, setRetryAt] = useState(0)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const operation = useRef<AbortController | null>(null)
  const sending = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    async function restore() {
      try {
        try {
          const session = await customerRequest<CustomerSessionResponse>('/api/customer/auth/session', { signal: controller.signal })
          if (!controller.signal.aborted) setState({ stage: 'complete', session })
          return
        } catch (error) {
          if (!(error instanceof CustomerApiError) || error.status !== 401) throw error
        }
        try {
          const profile = await customerRequest<{ csrfToken: string; expiresAt: string }>('/api/customer/auth/profile', { signal: controller.signal })
          if (!controller.signal.aborted) setState({ stage: 'name', ...profile })
          return
        } catch (error) {
          if (!(error instanceof CustomerApiError) || error.status !== 401) throw error
        }
        try {
          const challenge = await customerRequest<OtpChallengeResponse>('/api/customer/auth/otp-challenges/current', { signal: controller.signal })
          if (!controller.signal.aborted) setState({ stage: 'code', challenge, receivedAt: Date.now() })
        } catch (error) {
          if (!(error instanceof CustomerApiError) || error.status !== 404) throw error
          if (!controller.signal.aborted) setState({ stage: 'phone' })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ stage: 'loadError' })
          setFailure(error instanceof CustomerApiError ? error.detail : 'network')
        }
      }
    }
    void restore()
    return () => {
      controller.abort()
      operation.current?.abort()
    }
  }, [loadAttempt])

  async function send(work: (signal: AbortSignal) => Promise<AccessState>) {
    if (sending.current || Date.now() < retryAt) return false
    sending.current = true
    setPending(true)
    setFailure(null)
    const controller = new AbortController()
    operation.current = controller
    try {
      const next = await work(controller.signal)
      if (!controller.signal.aborted) setState(next)
      return !controller.signal.aborted
    } catch (error) {
      if (!controller.signal.aborted) {
        setFailure(error instanceof CustomerApiError ? error.detail : 'network')
        if (error instanceof CustomerApiError && error.detail.retryAfterSeconds) {
          setRetryAt(Date.now() + error.detail.retryAfterSeconds * 1000)
        }
        if (error instanceof CustomerApiError && error.status === 401) setState({ stage: 'phone' })
      }
      return false
    } finally {
      sending.current = false
      if (!controller.signal.aborted) setPending(false)
    }
  }

  const requestCode = (phone: string) => send(async signal => {
    const challenge = await customerRequest<OtpChallengeResponse>('/api/customer/auth/otp-challenges', { body: { phone }, signal })
    return { stage: 'code', challenge, receivedAt: Date.now() }
  })
  const resendCode = () => {
    if (state.stage !== 'code') return Promise.resolve()
    return send(async signal => {
      const challenge = await customerRequest<OtpChallengeResponse>('/api/customer/auth/otp-challenges', { body: { challengeId: state.challenge.challengeId }, signal })
      return { stage: 'code', challenge, receivedAt: Date.now() }
    })
  }
  const verifyCode = (code: string) => {
    if (state.stage !== 'code') return Promise.resolve()
    return send(async signal => {
      const result = await customerRequest<OtpVerificationResponse>('/api/customer/auth/otp-verifications', {
        body: { challengeId: state.challenge.challengeId, code }, signal,
      })
      return result.next === 'name'
        ? { stage: 'name', csrfToken: result.csrfToken, expiresAt: result.expiresAt }
        : { stage: 'complete', session: result.session }
    })
  }
  const completeProfile = (name: string) => {
    if (state.stage !== 'name') return Promise.resolve()
    return send(async signal => {
      const session = await customerRequest<CustomerSessionResponse>('/api/customer/auth/profile', {
        body: { name }, csrfToken: state.csrfToken, signal,
      })
      return { stage: 'complete', session }
    })
  }
  const signOut = () => {
    if (state.stage !== 'complete') return Promise.resolve()
    return send(async signal => {
      await customerRequest('/api/customer/auth/sign-out', { body: {}, csrfToken: state.session.csrfToken, signal })
      return { stage: 'phone' }
    })
  }
  function editPhone() {
    if (pending) return
    setState({ stage: 'phone' })
    setFailure(null)
    setRetryAt(0)
  }
  function reload() {
    setState({ stage: 'loading' })
    setFailure(null)
    setLoadAttempt(value => value + 1)
  }
  return { state, pending, failure, retryAt, requestCode, resendCode, verifyCode, completeProfile, signOut, editPhone, reload }
}
