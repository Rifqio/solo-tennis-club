import type { ReferenceKind, ReferenceRecord } from '@shared/api/admin-references'
export const referenceConfig = {
  coach: { path: 'coaches', label: { id: 'Coach', en: 'Coaches' }, add: { id: 'Tambah coach', en: 'Add coach' }, edit: { id: 'Ubah coach', en: 'Edit coach' }, empty: { id: 'Belum ada coach. Tambahkan coach untuk digunakan pada sesi.', en: 'No coaches yet. Add a coach to use in sessions.' }, noun: { id: 'coach', en: 'coaches' }, search: { id: 'Cari nama coach', en: 'Search coaches' } },
  venue: { path: 'venues', label: { id: 'Lokasi', en: 'Venues' }, add: { id: 'Tambah lokasi', en: 'Add venue' }, edit: { id: 'Ubah lokasi', en: 'Edit venue' }, empty: { id: 'Belum ada lokasi. Tambahkan lokasi untuk digunakan pada sesi.', en: 'No venues yet. Add a venue to use in sessions.' }, noun: { id: 'lokasi', en: 'venues' }, search: { id: 'Cari lokasi', en: 'Search venues' } },
  level: { path: 'levels', label: { id: 'Level', en: 'Levels' }, add: { id: 'Tambah level', en: 'Add level' }, edit: { id: 'Ubah level', en: 'Edit level' }, empty: { id: 'Belum ada level. Tambahkan level untuk digunakan pada sesi.', en: 'No levels yet. Add a level to use in sessions.' }, noun: { id: 'level', en: 'levels' }, search: { id: 'Cari level', en: 'Search levels' } },
} satisfies Record<ReferenceKind, object>

export const archiveEmpty = { id: 'Arsip kosong.', en: 'The archive is empty.' }

// A row's second line: where it is used (coach, level) or its address (venue).
export function referenceSubline(kind: ReferenceKind, row: ReferenceRecord) {
  if (kind === 'venue') return row.address ? { id: row.address, en: row.address } : { id: 'Alamat belum diisi', en: 'No address yet' }
  return row.classCount > 0
    ? { id: `Dipakai di ${row.classCount} kelas`, en: `Used in ${row.classCount} ${row.classCount === 1 ? 'class' : 'classes'}` }
    : { id: 'Belum dipakai di kelas', en: 'Not used by a class yet' }
}
