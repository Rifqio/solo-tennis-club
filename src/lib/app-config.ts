import { useEffect, useState } from 'react'
import type { AppConfigResponse } from '@shared/api/app-config'

// What this server offers the browser (the admin demo button, the hosted demo). Read once per page load; until it
// arrives, or if it fails, nothing extra is shown.
let cached: Promise<AppConfigResponse | null> | null = null

function readAppConfig() {
  cached ??= fetch('/api/public/app-config', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    .then(response => response.ok ? response.json() as Promise<AppConfigResponse> : null)
    .catch(() => null)
  return cached
}

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfigResponse | null>(null)
  useEffect(() => {
    let active = true
    void readAppConfig().then(value => { if (active) setConfig(value) })
    return () => { active = false }
  }, [])
  return config
}
