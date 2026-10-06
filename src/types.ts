export type EventType = 'ritual' | 'cultural' | 'food' | string

export interface ScheduleItem {
  date: string
  start: string
  end?: string
  title: string
  type: EventType
}

export interface Hours {
  date: string
  open: string
  close: string
  source: 'organizer' | 'default' | string
}

export interface Puja {
  id: string
  name: string
  organizer: string
  region: string
  weekend: number | null
  dates: { date: string }[]
  dateLabel: string
  description: string
  venue: { name: string; address: string; city: string; lat: number; lng: number; approximate?: boolean }
  schedule: ScheduleItem[]
  bhog: { available: boolean | null; price: string | null; details?: string; purchaseUrl?: string }
  entry: { free: boolean | null; ticketUrl?: string; notes?: string }
  links: Record<string, string>
  highlights: string[]
  status: 'verified' | 'partial' | 'tba'
  culturalPrograms: { date: string; time?: string; title: string; artist?: string; description?: string }[]
  contact?: { email?: string; phone?: string }
  notices?: string[]
  hours: Hours[]
  sources?: string[]
  researchNote?: string
}

export interface Home {
  label: string
  lat: number
  lng: number
}
