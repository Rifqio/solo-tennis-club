export const SIGN_OUT_REQUEST = 'stc:request-sign-out'
export function requestSignOut(action: () => void) {
  const event = new CustomEvent(SIGN_OUT_REQUEST, { cancelable: true, detail: action })
  if (window.dispatchEvent(event)) action()
}
