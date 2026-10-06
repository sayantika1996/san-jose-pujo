import { useMemo, useState } from 'react'
import { PujaMapPicker, routeLinkUrl } from '../components/GoogleMap'
import { allDates, fmtDate, fmtTime, pujas, todayIso } from '../data'
import { planDay, toHhmm } from '../planner'
import type { Home } from '../types'

export function Planner({ home, favs, query }: { home: Home; favs: string[]; query: string }) {
  const params = new URLSearchParams(query)
  const firstDate = allDates.find((d) => d >= todayIso()) ?? allDates[0]
  const [date, setDate] = useState(params.get('d') ?? firstDate)
  const [start, setStart] = useState(params.get('s') ?? '10:00')
  const [end, setEnd] = useState(params.get('e') ?? '21:30')
  const [visit, setVisit] = useState(Number(params.get('v') ?? 75))
  const [maxDrive, setMaxDrive] = useState(Number(params.get('r') ?? 45))
  const [must, setMust] = useState<string[]>(params.get('m')?.split(',').filter(Boolean) ?? [])
  const [copied, setCopied] = useState(false)

  const openThatDay = pujas.filter((p) => p.dates.some((d) => d.date === date))
  const mustToday = must.filter((id) => openThatDay.some((p) => p.id === id))

  const mustKey = mustToday.join(',')
  const plan = useMemo(
    () =>
      planDay(pujas, { date, start, end, home, visitMinutes: visit, maxDriveMinutes: maxDrive, mustVisit: mustKey ? mustKey.split(',') : [] }),
    [date, start, end, home, visit, maxDrive, mustKey],
  )

  const shareUrl = () => {
    const q = new URLSearchParams({ d: date, s: start, e: end, v: String(visit), r: String(maxDrive), m: mustToday.join(',') })
    return `${location.origin}${location.pathname}#/plan?${q}`
  }
  const shareText = () =>
    [
      `My pujo route for ${fmtDate(date, { weekday: 'long', month: 'short', day: 'numeric' })} 🪔`,
      ...plan.stops.map((s, i) => `${i + 1}. ${fmtTime(toHhmm(s.arrive))} ${s.puja.name} (${s.puja.venue.city})`),
      `Home by ~${fmtTime(toHhmm(plan.backHome))}`,
      `Route: ${routeLinkUrl(home, plan.stops.map((s) => s.puja))}`,
      shareUrl(),
    ].join('\n')

  const copy = async () => {
    await navigator.clipboard.writeText(shareText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inp = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm'
  const toggleMust = (id: string) => setMust((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-red-900">Pandal-hopping planner</h1>
        <p className="text-sm text-stone-600">
          Starts and ends at home. It tries every visiting order and picks the one that fits the most pujos (must-visits first) with the least driving.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-amber-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 text-sm">
          Date
          <select className={inp} value={date} onChange={(e) => setDate(e.target.value)}>
            {allDates.map((d) => (
              <option key={d} value={d}>{fmtDate(d)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Leave home
          <input type="time" className={inp} value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Back home by
          <input type="time" className={inp} value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Time at each pujo
          <select className={inp} value={visit} onChange={(e) => setVisit(Number(e.target.value))}>
            {[45, 60, 75, 90, 120, 180].map((v) => <option key={v} value={v}>{v} min</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Max drive from home
          <select className={inp} value={maxDrive} onChange={(e) => setMaxDrive(Number(e.target.value))}>
            {[20, 30, 45, 60, 90].map((v) => <option key={v} value={v}>{v} min</option>)}
          </select>
        </label>
        <div className="sm:col-span-2 lg:col-span-5">
          <p className="mb-2 text-sm">Must visit ({openThatDay.length} pujos open on {fmtDate(date)}):</p>
          <div className="flex flex-wrap gap-2">
            {openThatDay.map((p) => (
              <button
                key={p.id}
                onClick={() => toggleMust(p.id)}
                className={`rounded-full border px-3 py-1 text-xs ${must.includes(p.id) ? 'border-red-700 bg-red-700 text-white' : 'border-stone-300 bg-white hover:border-red-400'}`}
              >
                {favs.includes(p.id) && '★ '}
                {p.name.replace(/ Durga Puj[ao].*$/i, '')} · {p.venue.city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {plan.missedMustVisit.length > 0 && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Couldn't fit: {plan.missedMustVisit.map((p) => p.name).join(', ')}. Try a longer day or shorter visits.
        </p>
      )}

      {plan.stops.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
          No pujos fit that window. Widen the time range or the max drive.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <ol className="relative space-y-3 border-l-2 border-dashed border-red-300 pl-6">
              <li className="text-sm text-stone-600">🏠 Leave home at {fmtTime(start)}</li>
              {plan.stops.map((s, i) => (
                <li key={s.puja.id} className="relative rounded-2xl border border-amber-200 bg-white p-4">
                  <span className="absolute top-4 -left-[2.3rem] grid h-7 w-7 place-items-center rounded-full bg-red-700 text-xs font-bold text-white">{i + 1}</span>
                  <p className="text-xs text-stone-500">🚗 {s.driveIn} min drive</p>
                  <a href={`#/puja/${s.puja.id}`} className="font-display text-lg font-semibold text-red-900 hover:underline">{s.puja.name}</a>
                  <p className="text-sm text-stone-700">
                    {fmtTime(toHhmm(s.arrive))}–{fmtTime(toHhmm(s.leave))} · {s.puja.venue.city}
                  </p>
                  {s.estimatedHours && <p className="text-xs text-amber-700">Opening hours estimated. Confirm with the organizer.</p>}
                </li>
              ))}
              <li className="text-sm text-stone-600">
                🏠 {plan.driveHome} min drive home · back by {fmtTime(toHhmm(plan.backHome))}
              </li>
            </ol>
            <p className="text-sm text-stone-600">
              {plan.stops.length} pujos · ~{plan.totalDrive} min total driving. Drive times are rough estimates without live traffic.
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={copy} className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">
                {copied ? 'Copied!' : 'Copy plan'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText())}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-green-700 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50"
              >
                Share on WhatsApp
              </a>
            </div>
          </div>
          <div className="space-y-2">
            <PujaMapPicker pujas={plan.stops.map((s) => s.puja)} home={home} className="h-80" />
            <a
              href={routeLinkUrl(home, plan.stops.map((s) => s.puja))}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
            >
              Open full route in Google Maps (turn-by-turn) →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
