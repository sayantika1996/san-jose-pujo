import { statusLabel } from '../data'
import { driveMinutes } from '../planner'
import type { Home, Puja } from '../types'

const statusStyle: Record<Puja['status'], string> = {
  verified: 'bg-emerald-100 text-emerald-800',
  partial: 'bg-amber-100 text-amber-800',
  tba: 'bg-stone-200 text-stone-700',
}

export function StatusBadge({ status }: { status: Puja['status'] }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[status]}`}>{statusLabel[status]}</span>
}

export function FavButton({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
      aria-label={on ? 'Remove from my list' : 'Add to my list'}
      title={on ? 'Remove from my list' : 'Add to my list'}
      className={`rounded-full px-3 py-1 text-sm font-medium transition ${on ? 'bg-red-700 text-white' : 'border border-red-700 text-red-700 hover:bg-red-50'}`}
    >
      {on ? '★ On my list' : '☆ Add'}
    </button>
  )
}

export function PujaCard({ puja, home, fav, onFav }: { puja: Puja; home: Home; fav: boolean; onFav: () => void }) {
  const mins = driveMinutes(home, puja.venue)
  return (
    <a
      href={`#/puja/${puja.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg leading-tight font-semibold text-red-900">{puja.name}</h3>
        <FavButton on={fav} onClick={onFav} />
      </div>
      <p className="text-sm text-stone-600">
        {puja.venue.city} · {puja.region}
      </p>
      <p className="text-sm font-medium text-stone-800">{puja.dateLabel}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs">
        <StatusBadge status={puja.status} />
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">🚗 ~{mins} min from home</span>
        {puja.entry?.free && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-800">Free entry</span>}
        {puja.bhog?.available && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-800">Bhog</span>}
      </div>
    </a>
  )
}
