// A crash report from the 500 page. The report code is what the person reads out to the admin; the server log keeps
// it beside the page and the error so the two can be matched. No personal data: no names, phones or booking contents.
export const CLIENT_ERROR_CODE_PATTERN = /^STC-[0-9A-F]{4}-[0-9]{2}$/

export type ClientErrorKind = 'render' | 'chunk'

export interface ClientErrorReport {
  code: string
  kind: ClientErrorKind
  path: string
  message: string
}
