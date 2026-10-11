import { useEffect, useState } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { ErrorPage, type ErrorAudience } from './ErrorPage'
import { isChunkLoadError, makeReportCode, reportClientError } from './report-client-error'

// The router's error boundary: anything a screen throws while loading or drawing lands here. A missing route answer is
// a 404; everything else is the 500 page with a report code the server log also has.
export function RouteErrorPage({ audience = 'member' }: { audience?: ErrorAudience }) {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  const [code] = useState(makeReportCode)

  useEffect(() => {
    if (notFound) return
    console.error(`Client error ${code}`, error)
    reportClientError(code, isChunkLoadError(error) ? 'chunk' : 'render', error)
  }, [code, error, notFound])

  if (notFound) return <ErrorPage code={404} audience={audience} />
  return <ErrorPage code={500} audience={audience} reportCode={code} />
}

export function Component() { return <ErrorPage code={404} /> }
