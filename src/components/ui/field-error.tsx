import { CircleAlert } from 'lucide-react'

// The message under a field that is the cause (G1: field error, the default for forms): what is wrong and how to fix
// it, in brick with an icon, fading in over 150ms. It disappears at once when the field is valid.
export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} role="alert" className="notice-in flex items-start gap-1.5 text-label text-error">
      <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" strokeWidth={2.25} />
      <span className="min-w-0">{children}</span>
    </p>
  )
}
