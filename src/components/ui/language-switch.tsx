import { Check, Languages } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { isLanguage } from '@/i18n/types'
import type { Language } from '@/i18n/types'
import { cn } from '@/lib/utils'

const options: { language: Language; code: string; name: string }[] = [
  { language: 'id', code: 'ID', name: commonMessages.languageIndonesian.id },
  { language: 'en', code: 'EN', name: commonMessages.languageEnglish.en },
]

// App-bar action: a translate glyph plus the current code opens a Material menu listing each language in its own name.
export function LanguageMenu({ className }: { className?: string }) {
  const { language, setLanguage, t } = useI18n()
  const current = options.find(option => option.language === language) ?? options[0]
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn('state-layer inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full px-3 text-label font-bold text-on-signboard', className)}
        aria-label={`${current.code}, ${t(commonMessages.languageGroup)}: ${current.name}`}
      >
        <Languages aria-hidden="true" className="size-5" />
        <span aria-hidden="true">{current.code}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} className="z-50 min-w-52 rounded-sm bg-surface-container py-2 text-on-surface shadow-menu data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <DropdownMenu.Label className="px-4 py-1 text-label text-on-surface-variant">{t(commonMessages.languageGroup)}</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={language} onValueChange={value => { if (isLanguage(value)) setLanguage(value) }}>
            {options.map(option => (
              <DropdownMenu.RadioItem
                key={option.language}
                value={option.language}
                lang={option.language}
                className="flex min-h-12 cursor-pointer items-center gap-3 px-4 text-body outline-none data-[highlighted]:bg-surface-container-high"
              >
                <span className="flex size-5 items-center justify-center">
                  <DropdownMenu.ItemIndicator><Check aria-hidden="true" className="size-5 text-primary" /></DropdownMenu.ItemIndicator>
                </span>
                {option.name}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
