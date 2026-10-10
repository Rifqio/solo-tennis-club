// Initials for a coach without a portrait; the sample-data "Contoh" prefix is skipped so cards read like the board.
export function coachInitials(name: string) {
  const words = name.split(/\s+/).filter(word => word && word.toLowerCase() !== 'contoh')
  return words.slice(0, 2).map(word => word[0]!.toUpperCase()).join('') || '?'
}
