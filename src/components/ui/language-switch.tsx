import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import type { Language } from '@/i18n/types'
import { cn } from '@/lib/utils'

const options: { language: Language; label: string }[] = [
  { language: 'id', label: commonMessages.languageIndonesian.id },
  { language: 'en', label: commonMessages.languageEnglish.en },
]

// Each option is written in its own language so a visitor can find theirs without reading the other one.
export function LanguageSwitch({ className }: { className?: string }) {
  const { language, setLanguage, t } = useI18n()
  return (
    <div role="group" aria-label={t(commonMessages.languageGroup)} className={cn('flex flex-wrap gap-1 rounded-md bg-secondary p-1', className)}>
      {options.map(option => {
        const selected = option.language === language
        return (
          <button
            key={option.language}
            type="button"
            lang={option.language}
            aria-pressed={selected}
            onClick={() => setLanguage(option.language)}
            className={cn(
              'min-h-12 flex-1 basis-32 rounded-md border px-3 text-label break-words transition-colors duration-150',
              selected ? 'border-input bg-background font-bold text-foreground' : 'border-transparent font-normal text-muted-foreground hover:bg-background hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
