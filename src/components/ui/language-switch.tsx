import { Check } from 'lucide-react'
// Round flat flags (circle-flags, MIT): circles like the club's ball mark and the app's round buttons.
import flagId from 'circle-flags/flags/id.svg'
import flagGb from 'circle-flags/flags/gb.svg'
import { DropdownMenu } from 'radix-ui'
import { useState } from 'react'
import { Drawer } from 'vaul'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { isLanguage } from '@/i18n/types'
import type { Language } from '@/i18n/types'
import { selectionHaptic } from '@/lib/haptics'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'

const options: { language: Language; code: string; name: string; flag: string }[] = [
  { language: 'id', code: 'ID', name: commonMessages.languageIndonesian.id, flag: flagId },
  { language: 'en', code: 'EN', name: commonMessages.languageEnglish.en, flag: flagGb },
]

function Flag({ src, className }: { src: string; className?: string }) {
  return <img src={src} alt="" aria-hidden="true" width={24} height={24} className={cn('size-6 shrink-0 rounded-full', className)} />
}

const triggerClass = 'state-layer pressable inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full px-3 text-label font-bold text-on-signboard'

// The flag of the current language; its name is in the trigger's label.
function TriggerContent({ flag }: { flag: string }) {
  return <Flag src={flag} />
}

// App-bar language action. Phones get a bottom sheet you can drag away (thumb-reachable, like a native action sheet);
// tablets and desktops get a Material menu anchored to the button.
export function LanguageMenu({ className }: { className?: string }) {
  const { language, setLanguage, t } = useI18n()
  const isPhone = useMediaQuery('(max-width: 39.99rem)')
  const [sheetOpen, setSheetOpen] = useState(false)
  const current = options.find(option => option.language === language) ?? options[0]
  const label = `${current.code}, ${t(commonMessages.languageGroup)}: ${current.name}`

  const choose = (next: Language) => {
    if (next !== language) { setLanguage(next); selectionHaptic() }
  }

  if (isPhone) {
    return (
      <Drawer.Root open={sheetOpen} onOpenChange={setSheetOpen}>
        <Drawer.Trigger className={cn(triggerClass, className)} aria-label={label}>
          <TriggerContent flag={current.flag} />
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-scrim" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-xl bg-surface-container-low pb-[max(1rem,env(safe-area-inset-bottom))] text-on-surface shadow-sheet outline-none">
            <div aria-hidden="true" className="mx-auto mb-2 mt-3 h-1 w-8 rounded-full bg-outline" />
            <Drawer.Title className="px-6 pb-2 pt-2 text-title font-bold">{t(commonMessages.languageGroup)}</Drawer.Title>
            <Drawer.Description className="sr-only">{current.name}</Drawer.Description>
            <ul role="radiogroup" aria-label={t(commonMessages.languageGroup)} className="flex flex-col px-2 pb-2">
              {options.map(option => {
                const selected = option.language === language
                return (
                  <li key={option.language}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      lang={option.language}
                      onClick={() => { choose(option.language); setSheetOpen(false) }}
                      className="state-layer pressable flex min-h-14 w-full items-center gap-4 rounded-md px-4 text-left text-body"
                    >
                      <span className="flex size-6 items-center justify-center">
                        {selected && <Check aria-hidden="true" className="size-6 text-primary" />}
                      </span>
                      <Flag src={option.flag} />
                      <span className={selected ? 'font-bold' : undefined}>{option.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    )
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={cn(triggerClass, className)} aria-label={label}>
        <TriggerContent flag={current.flag} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} className="z-50 min-w-52 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-sm bg-surface-container py-2 text-on-surface shadow-menu data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <DropdownMenu.Label className="px-4 py-1 text-label text-on-surface-variant">{t(commonMessages.languageGroup)}</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={language} onValueChange={value => { if (isLanguage(value)) choose(value) }}>
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
                <Flag src={option.flag} className="size-5" />
                {option.name}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
