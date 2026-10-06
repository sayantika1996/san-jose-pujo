import raw from './data/pujas.json'
import type { Home, Puja } from './types'

export const MY_PUJOS = [
  'prabasi', 'prothoma', 'durgabari', 'abahan', 'womennow', 'bengalclub', 'fogbengal', 'sanskriti',
  'navashakti', 'bongotot', 'uhc', 'siliconvalley', 'pashchimi', 'baybasi', 'aparajita', 'agomoni',
]

export const pujas = (raw.pujas as unknown as Puja[]).filter((p) => MY_PUJOS.includes(p.id))
export const meta = raw.meta as {
  year: number
  lastVerified: string
  tithiReference: { date: string; label: string; labelBn: string }[]
  sourceNote: string
}

export const SAN_JOSE: Home = { label: 'Downtown San Jose', lat: 37.3382, lng: -121.8863 }

export const pujaById = (id: string) => pujas.find((p) => p.id === id)

export const allDates = Array.from(new Set(pujas.flatMap((p) => p.dates.map((d) => d.date)))).sort()

export const regions = Array.from(new Set(pujas.map((p) => p.region))).sort()

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', opts)
}

export function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return m ? `${h12}:${String(m).padStart(2, '0')}${suffix}` : `${h12}${suffix}`
}

export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const statusLabel: Record<Puja['status'], string> = {
  verified: 'Schedule published',
  partial: 'Details partial',
  tba: 'Dates TBA',
}
