// Error pages (boards E1-E4). Members get the casual voice; admin screens the formal one (G1, Wording).
export const errorPageMessages = {
  clubLabel: { id: 'Solo Tennis Club, halaman klub', en: 'Solo Tennis Club, club page' },
  member: {
    404: { tag: { id: '404 · Out', en: '404 · Out' }, title: { id: 'Bolanya keluar lapangan.', en: 'That ball went out.' }, body: { id: 'Halaman yang kamu cari nggak ada.', en: 'The page you are looking for does not exist.' } },
    500: { tag: { id: '500 · Gangguan server', en: '500 · Server problem' }, title: { id: 'Ada gangguan di sisi kami.', en: 'Something went wrong on our side.' }, body: { id: 'Coba lagi sebentar lagi.', en: 'Please try again in a moment.' } },
    401: { tag: { id: '401 · Perlu masuk', en: '401 · Sign in needed' }, title: { id: 'Masuk dulu, ya.', en: 'Please sign in first.' }, body: { id: 'Masuk dulu untuk membuka halaman ini.', en: 'Sign in to open this page.' } },
    403: { tag: { id: '403', en: '403' }, title: { id: 'Tidak ada akses.', en: 'No access.' }, body: { id: 'Kamu tidak punya akses ke halaman ini.', en: 'You do not have access to this page.' } },
  },
  admin: {
    404: { tag: { id: '404', en: '404' }, title: { id: 'Halaman tidak ditemukan.', en: 'Page not found.' }, body: { id: 'Alamat ini tidak ada di portal admin.', en: 'This address does not exist in the admin portal.' } },
    500: { tag: { id: '500 · Gangguan server', en: '500 · Server problem' }, title: { id: 'Terjadi gangguan di sisi kami.', en: 'Something went wrong on our side.' }, body: { id: 'Silakan coba lagi sebentar lagi.', en: 'Please try again in a moment.' } },
    401: { tag: { id: '401 · Perlu masuk', en: '401 · Sign in needed' }, title: { id: 'Silakan masuk.', en: 'Please sign in.' }, body: { id: 'Masuk sebagai admin untuk membuka halaman ini.', en: 'Sign in as an admin to open this page.' } },
    403: { tag: { id: '403', en: '403' }, title: { id: 'Tidak ada akses.', en: 'No access.' }, body: { id: 'Akun ini tidak punya akses ke halaman ini.', en: 'This account cannot open this page.' } },
  },
  reportCode: { id: 'Kode laporan', en: 'Report code' },
  reportHint: { id: 'Masih gagal? Sebut kode ini ke admin.', en: 'Still failing? Tell the admin this code.' },
  reportHintAdmin: { id: 'Jika masih gagal, catat kode ini untuk pengecekan.', en: 'If it keeps failing, note this code for checking.' },
  retry: { id: 'Coba lagi', en: 'Try again' },
  schedule: { id: 'Lihat jadwal', en: 'See the schedule' },
  club: { id: 'Ke halaman klub', en: 'Go to the club page' },
  bookings: { id: 'Booking kamu', en: 'Your bookings' },
  signIn: { id: 'Masuk', en: 'Sign in' },
  home: { id: 'Ke beranda', en: 'Go home' },
  sessions: { id: 'Ke Sesi', en: 'Go to Sessions' },
  adminBookings: { id: 'Booking masuk', en: 'Incoming bookings' },
}
