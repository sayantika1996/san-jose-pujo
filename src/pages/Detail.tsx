import { GoogleMapFrame, placeEmbedUrl, routeLinkUrl } from '../components/GoogleMap'
import { FavButton, StatusBadge } from '../components/PujaCard'
import { fmtDate, fmtTime, pujaById } from '../data'
import { distanceKm, driveMinutes, hoursOn, toHhmm } from '../planner'
import type { Home } from '../types'

const typeIcon: Record<string, string> = { ritual: '🪔', cultural: '🎶', food: '🍛' }

const safeUrl = (u?: string) => (u && /^https?:\/\//i.test(u) ? u : undefined)

export function Detail({ id, home, favs, toggle }: { id: string; home: Home; favs: string[]; toggle: (id: string) => void }) {
  const p = pujaById(id)
  if (!p) return <p>Pujo not found. <a className="text-red-700 underline" href="#/pujas">Back to all pujos</a></p>

  const dirUrl = routeLinkUrl(home, [p], false)
  const byDate = p.dates.map((d) => ({ date: d.date, items: p.schedule.filter((s) => s.date === d.date), hours: hoursOn(p, d.date) }))
  const links = Object.entries(p.links).filter(([, u]) => safeUrl(u))

  return (
    <div className="space-y-6">
      <a href="#/pujas" className="text-sm text-red-700 underline">← All pujos</a>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-red-900">{p.name}</h1>
          <p className="text-stone-600">{p.organizer}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={p.status} />
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-800">
              🚗 ~{driveMinutes(home, p.venue)} min · {Math.round(distanceKm(home, p.venue) * 0.621)} mi from home
            </span>
          </div>
        </div>
        <FavButton on={favs.includes(p.id)} onClick={() => toggle(p.id)} />
      </div>

      <p className="max-w-3xl text-stone-800">{p.description}</p>

      {p.notices?.length ? (
        <ul className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {p.notices.map((n) => <li key={n}>⚠️ {n}</li>)}
        </ul>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-2xl border border-amber-200 bg-white p-5">
            <h2 className="font-display text-xl font-semibold text-red-900">Schedule</h2>
            <p className="text-sm text-stone-600">{p.dateLabel}</p>
            {byDate.length === 0 && <p className="mt-3 text-sm text-stone-500">Dates not announced yet. Check the organizer's site.</p>}
            {byDate.map(({ date, items, hours }) => (
              <div key={date} className="mt-4">
                <h3 className="font-semibold text-stone-900">
                  {fmtDate(date, { weekday: 'long', month: 'short', day: 'numeric' })}
                  {hours && (
                    <span className="ml-2 text-sm font-normal text-stone-500">
                      open {fmtTime(toHhmm(hours.open))}–{fmtTime(toHhmm(hours.close))}
                      {hours.estimated && ' (estimated)'}
                    </span>
                  )}
                </h3>
                {items.length ? (
                  <ul className="mt-2 divide-y divide-stone-100">
                    {items.map((s, i) => (
                      <li key={i} className="flex gap-3 py-1.5 text-sm">
                        <span className="w-28 shrink-0 text-stone-500">
                          {fmtTime(s.start)}
                          {s.end && `–${fmtTime(s.end)}`}
                        </span>
                        <span>{typeIcon[s.type] ?? '•'} {s.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-stone-500">Detailed schedule not published.</p>
                )}
              </div>
            ))}
          </section>

          {p.culturalPrograms.length > 0 && (
            <section className="rounded-2xl border border-amber-200 bg-white p-5">
              <h2 className="font-display text-xl font-semibold text-red-900">Cultural programs</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {p.culturalPrograms.map((c, i) => (
                  <li key={i}>
                    <b>{c.title}</b>
                    {c.artist && ` · ${c.artist}`}
                    {c.date && <span className="text-stone-500"> · {fmtDate(c.date)}{c.time && ` ${fmtTime(c.time)}`}</span>}
                    {c.description && <p className="text-stone-600">{c.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <GoogleMapFrame src={placeEmbedUrl(p)} title={`Map of ${p.name}`} className="h-72" />
          <section className="space-y-3 rounded-2xl border border-amber-200 bg-white p-5 text-sm">
            <div>
              <p className="font-semibold">{p.venue.name}</p>
              <p className="text-stone-600">{[p.venue.address, p.venue.city].filter(Boolean).join(', ')}</p>
              <a href={dirUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block rounded-full bg-red-700 px-4 py-1.5 font-medium text-white">
                Directions from home
              </a>
            </div>
            <div>
              <p className="font-semibold">Entry</p>
              <p className="text-stone-600">{p.entry.free === true ? 'Free' : p.entry.free === false ? 'Ticketed' : 'Not confirmed'}{p.entry.notes && ` · ${p.entry.notes}`}</p>
              {safeUrl(p.entry.ticketUrl) && <a className="text-red-700 underline" href={safeUrl(p.entry.ticketUrl)} target="_blank" rel="noreferrer">Tickets</a>}
            </div>
            <div>
              <p className="font-semibold">Bhog</p>
              <p className="text-stone-600">{p.bhog?.available ? p.bhog.details || 'Available' : 'Not confirmed'}{p.bhog?.price && ` · ${p.bhog.price}`}</p>
              {safeUrl(p.bhog?.purchaseUrl) && <a className="text-red-700 underline" href={safeUrl(p.bhog?.purchaseUrl)} target="_blank" rel="noreferrer">Buy bhog</a>}
            </div>
            {links.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {links.map(([k, u]) => (
                  <a key={k} className="text-red-700 capitalize underline" href={u} target="_blank" rel="noreferrer">{k}</a>
                ))}
              </div>
            )}
            {p.sources?.length ? (
              <div>
                <p className="font-semibold">Sources</p>
                <ul className="space-y-0.5">
                  {p.sources.filter((u) => safeUrl(u)).map((u) => (
                    <li key={u} className="truncate"><a className="text-red-700 underline" href={u} target="_blank" rel="noreferrer">{u.replace(/^https?:\/\/(www\.)?/, '')}</a></li>
                  ))}
                </ul>
              </div>
            ) : null}
            {p.highlights.length > 0 && (
              <ul className="list-inside list-disc text-stone-700">{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
