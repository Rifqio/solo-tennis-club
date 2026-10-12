// Shares a link with the phone's share sheet, or copies it where there is none. Returns 'copied' when the caller should
// confirm with a toast; a share sheet confirms itself, and a dismissed one needs nothing.
export async function shareLink(url: string, title: string): Promise<'shared' | 'copied' | 'none'> {
  if (navigator.share) {
    try { await navigator.share({ url, title }); return 'shared' } catch { return 'none' }
  }
  try { await navigator.clipboard.writeText(url); return 'copied' } catch { return 'none' }
}

// A download name for one photo: "<class> <date> 03.webp".
export function photoFileName(className: string, date: string, index: number, url: string) {
  const extension = /\.(jpg|png|webp)$/.exec(url)?.[1] ?? 'jpg'
  const base = `${className} ${date}`.replace(/[^\p{L}\p{N} -]+/gu, '').trim().slice(0, 80) || 'foto'
  return `${base} ${String(index + 1).padStart(2, '0')}.${extension}`
}
