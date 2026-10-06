import type { Puja } from './types'

export interface Point {
  lat: number
  lng: number
}

const DEFAULT_OPEN = '10:00'
const DEFAULT_CLOSE = '21:00'
const PARKING_MIN = 8
const MAX_CANDIDATES = 10

export function distanceKm(a: Point, b: Point) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Rough Bay Area drive estimate: road factor 1.35, ~55 km/h average, plus parking. */
export function driveMinutes(a: Point, b: Point) {
  const km = distanceKm(a, b) * 1.35
  if (km < 0.2) return 0
  return Math.round((km / 55) * 60 + PARKING_MIN)
}

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export const toHhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`

export function hoursOn(p: Puja, date: string): { open: number; close: number; estimated: boolean } | null {
  if (!p.dates.some((d) => d.date === date)) return null
  const h = p.hours.find((x) => x.date === date)
  if (h) return { open: toMin(h.open), close: toMin(h.close), estimated: h.source !== 'organizer' }
  const items = [
    ...p.schedule.filter((s) => s.date === date),
    ...p.culturalPrograms.filter((c) => c.date === date && c.time).map((c) => ({ start: c.time as string, end: undefined })),
  ]
  if (items.length) {
    const open = Math.min(...items.map((s) => toMin(s.start)))
    const close = Math.max(...items.map((s) => toMin(s.end ?? s.start) + (s.end ? 0 : 120)))
    return { open, close, estimated: true }
  }
  return { open: toMin(DEFAULT_OPEN), close: toMin(DEFAULT_CLOSE), estimated: true }
}

export interface PlanInput {
  date: string
  start: string
  end: string
  home: Point
  visitMinutes: number
  maxDriveMinutes: number
  mustVisit: string[]
}

export interface Stop {
  puja: Puja
  driveIn: number
  arrive: number
  leave: number
  estimatedHours: boolean
}

export interface Plan {
  stops: Stop[]
  driveHome: number
  backHome: number
  totalDrive: number
  missedMustVisit: Puja[]
  candidates: number
}

/**
 * Exact search over visit orders (small travelling-salesman with time windows).
 * Objective, in priority order: must-visits included, number of pujos, least driving.
 */
export function planDay(all: Puja[], input: PlanInput): Plan {
  const start = toMin(input.start)
  const end = toMin(input.end)

  const open = all
    .map((p) => ({ p, h: hoursOn(p, input.date) }))
    .filter((x): x is { p: Puja; h: NonNullable<ReturnType<typeof hoursOn>> } => x.h !== null)
    .filter((x) => input.mustVisit.includes(x.p.id) || driveMinutes(input.home, x.p.venue) <= input.maxDriveMinutes)

  const must = open.filter((x) => input.mustVisit.includes(x.p.id))
  const rest = open
    .filter((x) => !input.mustVisit.includes(x.p.id))
    .sort((a, b) => distanceKm(input.home, a.p.venue) - distanceKm(input.home, b.p.venue))
  const cands = [...must, ...rest].slice(0, Math.max(MAX_CANDIDATES, must.length))

  const n = cands.length
  const drive = cands.map((a) => cands.map((b) => driveMinutes(a.p.venue, b.p.venue)))
  const fromHome = cands.map((c) => driveMinutes(input.home, c.p.venue))

  type Best = { order: number[]; times: [number, number, number][]; must: number; drive: number }
  let best: Best | null = null
  const better = (mustCount: number, len: number, totalDrive: number) =>
    !best ||
    mustCount > best.must ||
    (mustCount === best.must && len > best.order.length) ||
    (mustCount === best.must && len === best.order.length && totalDrive < best.drive)

  const order: number[] = []
  const times: [number, number, number][] = []
  const used = new Array(n).fill(false)

  const dfs = (time: number, last: number, driven: number, mustCount: number) => {
    const home = last < 0 ? 0 : fromHome[last]
    if (time + home <= end && better(mustCount, order.length, driven + home)) {
      best = { order: [...order], times: times.map((t) => [...t] as [number, number, number]), must: mustCount, drive: driven + home }
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue
      const d = last < 0 ? fromHome[i] : drive[last][i]
      const arrive = Math.max(time + d, cands[i].h.open)
      const leave = arrive + input.visitMinutes
      if (leave > cands[i].h.close || leave + fromHome[i] > end) continue
      used[i] = true
      order.push(i)
      times.push([d, arrive, leave])
      dfs(leave, i, driven + d, mustCount + (input.mustVisit.includes(cands[i].p.id) ? 1 : 0))
      order.pop()
      times.pop()
      used[i] = false
    }
  }
  dfs(start, -1, 0, 0)

  const b = best as Best | null
  const stops: Stop[] = (b?.order ?? []).map((i, k) => ({
    puja: cands[i].p,
    driveIn: b!.times[k][0],
    arrive: b!.times[k][1],
    leave: b!.times[k][2],
    estimatedHours: cands[i].h.estimated,
  }))
  const last = stops.at(-1)
  const driveHome = last ? driveMinutes(last.puja.venue, input.home) : 0
  const visited = new Set(stops.map((s) => s.puja.id))
  return {
    stops,
    driveHome,
    backHome: last ? last.leave + driveHome : start,
    totalDrive: b?.drive ?? 0,
    missedMustVisit: all.filter((p) => input.mustVisit.includes(p.id) && !visited.has(p.id)),
    candidates: n,
  }
}
