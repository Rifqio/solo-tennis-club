import { SAMPLE_QR_SRC } from './sample-qr'

export function SampleQr({ label, className }: { label: string; className?: string }) {
  return <img role="img" alt={label} src={SAMPLE_QR_SRC} className={className} />
}
