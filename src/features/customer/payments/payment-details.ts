// How members pay the club (03-DECISIONS §1): one static QRIS and one bank account. Until the club supplies its own,
// both are samples, labelled on screen as not usable for paying ("Contoh QR, belum bisa dipakai bayar"). Replacing
// these values with the club's is the only change needed; `sample` then becomes false.
export interface PaymentDetails {
  sample: boolean
  merchantName: string
  // The QRIS merchant id printed under the code; null shows the merchant name alone.
  nmid: string | null
  // The club's QRIS image. Null draws the sample pattern instead.
  qrisImageSrc: string | null
  bankName: string
  accountNumber: string
  accountHolder: string
}

export const paymentDetails: PaymentDetails = {
  sample: true,
  merchantName: 'Solo Tennis Club',
  nmid: null,
  qrisImageSrc: null,
  bankName: 'Bank Contoh',
  accountNumber: '0000000000',
  accountHolder: 'Solo Tennis Club',
}
