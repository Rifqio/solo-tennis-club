import { Select } from 'radix-ui'
import { Check, ChevronDown } from 'lucide-react'
import { useId } from 'react'
import { useI18n } from '@/i18n/use-i18n'
import { commonMessages } from '@/i18n/common.messages'
import { FieldError } from '@/components/ui/field-error'
export function SelectField({ name, label, value, onChange, options, hint, error, placeholder }: {
  name: string; label: string; value: string; onChange: (value: string) => void; options: { id: string; name: string }[]; hint?: string; error?: string; placeholder: string
}) {
  const id = useId()
  const { t } = useI18n()
  const missing = value && !options.some(option => option.id === value)
  return <div data-field-group className="flex min-w-0 flex-col gap-2">
    <label htmlFor={id} className="text-label font-bold">{label}</label>
    <Select.Root name={name} value={value} onValueChange={onChange}>
      <Select.Trigger id={id} data-field={name} aria-invalid={Boolean(error)} aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined}
        className={`group state-layer flex min-h-12 w-full min-w-0 items-center justify-between gap-3 rounded-sm border bg-surface-container-lowest px-3 py-2 text-left text-body transition-colors duration-150 data-[state=open]:border-primary ${error ? 'border-error' : 'border-outline'}`}>
        <span className="min-w-0 break-words"><Select.Value placeholder={placeholder} /></span><Select.Icon><ChevronDown aria-hidden="true" className="size-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal><Select.Content position="popper" sideOffset={8} className="menu-motion z-50 max-h-[min(24rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] origin-[var(--radix-select-content-transform-origin)] overflow-hidden rounded-sm bg-surface-container text-on-surface shadow-menu">
        <Select.Viewport className="p-1">
          {missing && <Select.Item value={value} disabled className="min-h-12 break-words px-3 py-2"><Select.ItemText>{t(commonMessages.unavailable)}</Select.ItemText></Select.Item>}
          {options.map(option => <Select.Item key={option.id} value={option.id} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-sm px-3 py-2 outline-none transition-colors duration-150 data-[highlighted]:bg-surface-container-high data-[state=checked]:text-primary">
            <span className="flex size-5 shrink-0 items-center"><Select.ItemIndicator className="check-enter"><Check aria-hidden="true" className="size-5" /></Select.ItemIndicator></span><Select.ItemText><span className="break-words">{option.name}</span></Select.ItemText>
          </Select.Item>)}
        </Select.Viewport>
      </Select.Content></Select.Portal>
    </Select.Root>
    {hint && <p id={`${id}-hint`} className="text-label text-on-surface-variant">{hint}</p>}
    {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
  </div>
}
