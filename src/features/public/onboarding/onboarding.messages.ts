// Written the way the club talks in its WhatsApp group: casual Indonesian, with the English words members already use
// (booking, slot, coach, login). Each line only states what the app does today.
export const onboardingMessages = {
  label: { id: 'Kenalan sama STC', en: 'Welcome to STC' },
  skip: { id: 'Lewati', en: 'Skip' },
  previous: { id: 'Sebelumnya', en: 'Previous' },
  next: { id: 'Lanjut', en: 'Next' },
  start: { id: 'Mulai', en: 'Start' },
  startHint: { id: 'Tap atau geser buat mulai', en: 'Tap or slide to start' },
  progress: { id: '{current} dari {total}', en: '{current} of {total}' },
  slides: [
    {
      title: { id: 'Mau main kapan?', en: 'When do you want to play?' },
      body: { id: 'Cek jadwal kelas, coach, sama slot yang masih kosong. Nggak perlu login.', en: 'Check classes, coaches and open slots. No login needed.' },
    },
    {
      title: { id: 'Booking bareng teman', en: 'Book with your friends' },
      body: { id: 'Satu booking bisa buat beberapa orang sekaligus. Nama tiap pemain bisa kamu ganti.', en: "One booking can cover a few people at once. You can change each player's name." },
    },
    {
      title: { id: 'Slot kamu aman 5 jam', en: 'Your slot is held for 5 hours' },
      body: { id: 'Habis booking, slot kamu kami tahan 5 jam. Bayar sebelum waktunya habis, ya.', en: 'After you book, we hold your slot for 5 hours. Pay before the time runs out.' },
    },
  ],
}
