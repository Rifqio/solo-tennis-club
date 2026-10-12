import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { Link, useSearchParams } from 'react-router-dom'
import type { AdminRecapClassRow, AdminRecapResponse } from '@shared/api/admin-recap'
import { addClubMonths, clubMonthOf, isClubMonth } from '@shared/club-time'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadFailed } from '@/components/ui/load-failed'
import { Skeleton } from '@/components/ui/skeleton'
import { formatClubDayRange, formatClubMonthShort, formatClubMonthYear, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { useMediaQuery } from '@/lib/use-media-query'
import { stepEnter, useStepDirection } from '@/lib/step-motion'
import { cn } from '@/lib/utils'
import { useAdminResource } from '../forms/use-admin-resource'
import { AdminBand } from '../shell/AdminBand'
import { recapMessages as messages } from './recap.messages'

const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0)
const monthIndex = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7))

function useRangeLabel(recap: Pick<AdminRecapResponse, 'range' | 'partial'>) {
  const { language, t } = useI18n()
  const range = formatClubDayRange(recap.range.from, recap.range.to, language)
  return recap.partial ? t(messages.running) : range
}

// Band control: the month, with the days it covers, between previous and next. No month after the current one.
function MonthSwitch({ month, latest, recap, onGo }: { month: string; latest: string; recap: AdminRecapResponse | null; onGo: (month: string) => void }) {
  const { language, t } = useI18n()
  const range = useRangeLabel(recap ?? { range: { from: `${month}-01`, to: `${month}-01` }, partial: false })
  const atLatest = month >= latest
  const arrow = 'state-layer pressable flex size-12 shrink-0 items-center justify-center rounded-sm disabled:cursor-default disabled:opacity-40'
  return (
    <div role="group" aria-label={t(messages.monthGroup)} className="flex items-center justify-between gap-2 rounded-md bg-band-tile p-1 lg:min-w-[22rem]">
      <button type="button" aria-label={t(messages.previous)} onClick={() => onGo(addClubMonths(month, -1))} className={arrow}><ChevronLeft aria-hidden="true" className="size-6" /></button>
      <span aria-live="polite" className="flex min-w-0 flex-col items-center text-center leading-tight">
        <span className="text-title font-bold">{formatClubMonthYear(`${month}-01`, language)}</span>
        {recap?.month === month && <span className="text-label">{range}</span>}
      </span>
      <button type="button" aria-label={t(messages.next)} disabled={atLatest} onClick={() => onGo(addClubMonths(month, 1))} className={arrow}><ChevronRight aria-hidden="true" className="size-6" /></button>
    </div>
  )
}

function ExportLink({ month, className }: { month: string; className?: string }) {
  const { t } = useI18n()
  return (
    <Button asChild variant="outlined" className={cn('min-h-13 border-outline-variant bg-surface-container-lowest font-semibold', className)}>
      <a href={`/api/admin/recap/export?month=${month}`} download><Download aria-hidden="true" className="size-5" />{t(messages.export)}</a>
    </Button>
  )
}

// One answer first (board 19): what was paid. The label says what counts; the pill says the change and against what.
function RevenueCard({ recap }: { recap: AdminRecapResponse }) {
  const { language, t } = useI18n()
  const comparison = recap.comparison
  const period = comparison ? (recap.partial ? t(messages.paidDuring, { range: formatClubDayRange(comparison.from, comparison.to, language) }) : formatClubMonthYear(comparison.from, language)) : ''
  const short = comparison ? (recap.partial ? `${Number(comparison.from.slice(8))}-${Number(comparison.to.slice(8))} ${formatClubMonthShort(comparison.month, language)}` : formatClubMonthShort(comparison.month, language)) : ''
  const change = comparison?.changePct ?? 0
  const Arrow = change < 0 ? ArrowDown : ArrowUp
  return (
    <section aria-labelledby="recap-revenue" className="col-span-2 flex flex-col gap-1.5 rounded-sm bg-surface-container-lowest px-4 py-4.5 lg:col-span-1">
      <h2 id="recap-revenue" className="text-label font-semibold text-on-surface-variant">{t(messages.revenue)}</h2>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-display font-bold tabular-nums lg:text-headline">{formatIdr(recap.revenueIdr, language)}</span>
        {comparison && (
          <span aria-label={t(change > 0 ? messages.up : change < 0 ? messages.down : messages.same, { pct: Math.abs(change), period })}
            className="flex items-center gap-1 whitespace-nowrap rounded-full bg-primary-container px-2.5 py-1 text-label font-semibold tabular-nums text-primary">
            {change !== 0 && <Arrow aria-hidden="true" className="size-3.5" strokeWidth={2.75} />}{Math.abs(change)}% · {short}
          </span>
        )}
      </div>
    </section>
  )
}

// The one thing to act on: who still owes. Opens Booking masuk, which starts on Belum bayar.
function PendingRow({ recap }: { recap: AdminRecapResponse }) {
  const { language, t } = useI18n()
  if (!recap.pending.bookings) {
    return <p className="col-span-2 rounded-sm bg-surface-container-lowest px-4 py-3.5 text-on-surface-variant lg:col-span-1 lg:flex lg:items-center">{t(messages.pendingNone)}</p>
  }
  return (
    <Link to="/admin/bookings" viewTransition data-nav="tab"
      className="state-layer pressable col-span-2 flex min-h-16 items-center gap-3 rounded-sm bg-warning-container py-3 pl-4 pr-3 lg:col-span-1">
      <span className="flex min-w-0 flex-1 flex-col leading-snug">
        <span className="text-label font-semibold text-warning">{t(messages.pending)}</span>
        <span className="text-title font-bold tabular-nums">{formatIdr(recap.pending.amountIdr, language)} <span className="text-body font-medium text-on-surface-variant">· {t(messages.pendingCount, { count: recap.pending.bookings })}</span></span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-label font-semibold text-warning">{t(messages.view)}<ChevronRight aria-hidden="true" className="size-5" /></span>
    </Link>
  )
}

function FillBar({ pct, className }: { pct: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('block h-1.5 overflow-hidden rounded-full bg-surface-container-high', className)}>
      <span className="block h-full rounded-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
    </span>
  )
}

function Facts({ recap }: { recap: AdminRecapResponse }) {
  const { t } = useI18n()
  const pct = percent(recap.places.used, recap.places.capacity)
  return <>
    <section aria-labelledby="recap-fill" className="flex flex-col gap-1.5 rounded-sm bg-surface-container-lowest px-4 py-3.5">
      <h2 id="recap-fill" className="text-label font-semibold text-on-surface-variant">{t(messages.fill)}</h2>
      <span className="text-headline font-bold leading-none tabular-nums">{pct}%</span>
      <FillBar pct={pct} />
      <span className="text-label tabular-nums text-on-surface-variant">{t(messages.fillOf, { used: recap.places.used, capacity: recap.places.capacity })}</span>
    </section>
    <section aria-labelledby="recap-sessions" className="flex flex-col gap-1.5 rounded-sm bg-surface-container-lowest px-4 py-3.5">
      <h2 id="recap-sessions" className="text-label font-semibold text-on-surface-variant">{t(messages.sessions)}</h2>
      <span className="text-headline font-bold leading-none tabular-nums">{recap.sessions.held}</span>
      <span className="text-label text-on-surface-variant">{t(messages.cancelled, { count: recap.sessions.cancelled })}</span>
    </section>
  </>
}

// Six months of paid revenue; the chosen month is lime and every bar opens its month.
function RevenueChart({ recap, onGo }: { recap: AdminRecapResponse; onGo: (month: string) => void }) {
  const { language, t } = useI18n()
  const max = Math.max(1, ...recap.months.map(entry => entry.revenueIdr))
  const millions = (amount: number) => (amount / 1_000_000).toLocaleString(language === 'id' ? 'id-ID' : 'en-GB', { maximumFractionDigits: 1 })
  const runningShown = recap.months.some(entry => entry.month === recap.latestMonth)
  return (
    <section aria-labelledby="recap-chart" className="flex flex-col gap-3 rounded-sm bg-surface-container-lowest p-4 lg:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="recap-chart" className="text-title font-bold">{t(messages.chart)}</h2>
        <span className="text-label text-on-surface-variant">{t(messages.chartUnit)}</span>
      </div>
      <ol className="grid h-48 grid-cols-6 items-end gap-2">
        {recap.months.map(entry => {
          const chosen = entry.month === recap.month
          const label = formatClubMonthShort(entry.month, language) + (entry.month === recap.latestMonth ? '*' : '')
          return (
            <li key={entry.month} className="h-full">
              <button type="button" aria-pressed={chosen} onClick={() => onGo(entry.month)}
                aria-label={t(messages.barLabel, { month: formatClubMonthYear(`${entry.month}-01`, language), amount: formatIdr(entry.revenueIdr, language) })}
                className="pressable flex h-full w-full flex-col justify-end gap-1">
                <span className="text-center text-label font-semibold tabular-nums text-on-surface-variant">{millions(entry.revenueIdr)}</span>
                <span className={cn('block rounded-t-sm rounded-b-[2px] transition-[height,background-color] duration-300 ease-out',
                  chosen ? 'bg-accent outline-2 -outline-offset-2 outline-ink' : 'bg-band-tile')}
                  style={{ height: `${Math.max(entry.revenueIdr ? 4 : 2, Math.round((entry.revenueIdr / max) * 140))}px` }} />
                <span className={cn('text-center text-label', chosen ? 'font-bold text-on-surface' : 'text-on-surface-variant')}>{label}</span>
              </button>
            </li>
          )
        })}
      </ol>
      {runningShown && <p className="text-label text-on-surface-variant">{t(messages.chartRunning)}</p>}
    </section>
  )
}

function ClassBreakdown({ rows, table }: { rows: AdminRecapClassRow[]; table: boolean }) {
  const { language, t } = useI18n()
  if (!rows.length) return null
  return (
    <section aria-labelledby="recap-classes" className="flex flex-col rounded-sm bg-surface-container-lowest px-4 pb-1 pt-4 lg:px-5">
      <h2 id="recap-classes" className="pb-1 text-title font-bold">{t(messages.classes)}</h2>
      {table ? (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant text-label text-on-surface-variant">
              <th scope="col" className="py-2.5 font-semibold">{t(messages.colClass)}</th>
              <th scope="col" className="py-2.5 text-right font-semibold">{t(messages.colSessions)}</th>
              <th scope="col" className="w-40 py-2.5 pl-4 font-semibold">{t(messages.colFill)}</th>
              <th scope="col" className="py-2.5 pl-6 text-right font-semibold">{t(messages.colRevenue)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const pct = percent(row.used, row.capacity)
              return (
                <tr key={row.id} className="border-b border-outline-variant last:border-b-0">
                  <td className="py-3 font-semibold">{row.name}</td>
                  <td className="py-3 text-right tabular-nums">{row.sessions}</td>
                  <td className="py-3 pl-4"><span className="flex items-center gap-2"><FillBar pct={pct} className="flex-1" /><span className="w-10 text-right text-label tabular-nums">{pct}%</span></span></td>
                  <td className="whitespace-nowrap py-3 pl-6 text-right font-semibold tabular-nums">{formatIdr(row.revenueIdr, language)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <ul>
          {rows.map(row => {
            const pct = percent(row.used, row.capacity)
            return (
              <li key={row.id} className="flex items-center gap-4 border-b border-outline-variant py-3 last:border-b-0">
                <span className="flex min-w-0 flex-1 flex-col gap-1.5 leading-snug">
                  <span className="font-semibold">{row.name}</span>
                  <span className="text-label tabular-nums text-on-surface-variant">{t(messages.classMeta, { sessions: row.sessions, pct })}</span>
                  <FillBar pct={pct} className="h-1" />
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{formatIdr(row.revenueIdr, language)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// Rekap (OPER-12, OPER-13): board 19 on phones, D7 from 1024px. A booking counts in its session's month.
export function Component() {
  const { language, t } = useI18n()
  const [params, setParams] = useSearchParams()
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const reduceMotion = useReducedMotion()
  const latest = clubMonthOf(new Date())
  const requested = params.get('month')
  const month = isClubMonth(requested) && requested <= latest ? requested : latest
  const { data, response, retry } = useAdminResource<AdminRecapResponse>(`/api/admin/recap?month=${month}`)
  const recap = data?.month === month ? data : null
  // Numbers slide in from the side the admin moved towards; the bars just grow.
  const direction = useStepDirection(monthIndex(month))
  const go = (next: string) => setParams(next === latest ? {} : { month: next }, { replace: true })
  const empty = recap && !recap.places.capacity && !recap.sessions.cancelled && !recap.revenueIdr && !recap.pending.bookings

  return <>
    <AdminBand title={t(messages.heading)} action={isDesktop ? <ExportLink month={month} /> : undefined}>
      <MonthSwitch month={month} latest={recap?.latestMonth ?? latest} recap={recap} onGo={go} />
    </AdminBand>
    <div className="page-gutter desk-column mx-auto flex w-full max-w-[50rem] flex-col gap-3 py-4 lg:gap-4 lg:pt-5">
      {!recap ? (
        response && response.kind !== 'ok' && response.kind !== 'aborted'
          ? <LoadFailed voice="admin" title={t(messages.error)} onRetry={retry} />
          : <Skeleton shape="card" count={3} label={t(messages.loading)} voice="admin" onRetry={retry} />
      ) : <>
        <m.div key={month} {...stepEnter(direction, reduceMotion)} className="flex flex-col gap-3 lg:gap-4">
          {empty ? (
            // The month already slides in from the side, so the picture does not settle in on top of it.
            <EmptyState scene="empty-history" still title={t(messages.empty, { month: formatClubMonthYear(`${month}-01`, language) })} body={t(messages.emptyBody)} />
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              <RevenueCard recap={recap} />
              <PendingRow recap={recap} />
              <Facts recap={recap} />
            </div>
          )}
        </m.div>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-4">
          <RevenueChart recap={recap} onGo={go} />
          <m.div key={month} {...stepEnter(direction, reduceMotion)}><ClassBreakdown rows={recap.classes} table={isDesktop} /></m.div>
        </div>
        {!isDesktop && <ExportLink month={month} className="w-full" />}
      </>}
    </div>
  </>
}
