// One page of an admin list sorted by name (Kelola, Kelas). `nextCursor` continues after the last item; `total`
// counts every match for the current search, so screens can say "20 dari 47".
export interface PagedList<T> { items: T[]; nextCursor: string | null; total: number }

export const LIST_PAGE_SIZE = 20
export const LIST_PAGE_MAX = 50
