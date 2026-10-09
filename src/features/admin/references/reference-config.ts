import type { ReferenceKind } from '@shared/api/admin-references'
export const referenceConfig = {
  coach: { path: 'coaches', label: { id: 'Pelatih', en: 'Coaches' }, add: { id: 'Tambah pelatih', en: 'Add coach' }, edit: { id: 'Ubah pelatih', en: 'Edit coach' }, empty: { id: 'Belum ada pelatih. Tambahkan pelatih untuk digunakan pada sesi.', en: 'No coaches yet. Add a coach to use in sessions.' } },
  venue: { path: 'venues', label: { id: 'Lokasi', en: 'Venues' }, add: { id: 'Tambah lokasi', en: 'Add venue' }, edit: { id: 'Ubah lokasi', en: 'Edit venue' }, empty: { id: 'Belum ada lokasi. Tambahkan lokasi untuk digunakan pada sesi.', en: 'No venues yet. Add a venue to use in sessions.' } },
  level: { path: 'levels', label: { id: 'Level', en: 'Levels' }, add: { id: 'Tambah level', en: 'Add level' }, edit: { id: 'Ubah level', en: 'Edit level' }, empty: { id: 'Belum ada level. Tambahkan level untuk digunakan pada sesi.', en: 'No levels yet. Add a level to use in sessions.' } },
} satisfies Record<ReferenceKind, object>
