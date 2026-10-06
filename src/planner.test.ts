import { describe, expect, it } from 'vitest'
import { pujas, SAN_JOSE } from './data'
import { driveMinutes, planDay } from './planner'

describe('planDay', () => {
  it('builds a feasible plan that respects hours and gets home on time', () => {
    const plan = planDay(pujas, {
      date: '2026-10-17',
      start: '10:00',
      end: '22:00',
      home: SAN_JOSE,
      visitMinutes: 75,
      maxDriveMinutes: 60,
      mustVisit: [],
    })
    expect(plan.stops.length).toBeGreaterThan(1)
    let t = 10 * 60
    for (const s of plan.stops) {
      expect(s.arrive).toBeGreaterThanOrEqual(t + s.driveIn)
      expect(s.leave - s.arrive).toBe(75)
      t = s.leave
    }
    expect(plan.backHome).toBeLessThanOrEqual(22 * 60)
  })

  it('prioritises must-visit pujos even when far', () => {
    const plan = planDay(pujas, {
      date: '2026-10-17',
      start: '09:00',
      end: '23:00',
      home: SAN_JOSE,
      visitMinutes: 60,
      maxDriveMinutes: 20,
      mustVisit: ['agomoni'],
    })
    expect(plan.stops.map((s) => s.puja.id)).toContain('agomoni')
  })

  it('estimates zero drive for the same spot', () => {
    expect(driveMinutes(SAN_JOSE, SAN_JOSE)).toBe(0)
  })
})
