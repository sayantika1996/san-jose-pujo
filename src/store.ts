import { useEffect, useState } from 'react'
import { MY_PUJOS, SAN_JOSE } from './data'
import type { Home } from './types'

function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key)
      return s ? (JSON.parse(s) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue] as const
}

export function useHome() {
  return useStored<Home>('pujo.home', SAN_JOSE)
}

export function useFavorites() {
  const [favs, setFavs] = useStored<string[]>('pujo.favorites', MY_PUJOS)
  const toggle = (id: string) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
  return { favs, toggle }
}

export function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '')
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
