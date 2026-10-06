import { meta } from './data'
import { Detail } from './pages/Detail'
import { Directory } from './pages/Directory'
import { Events } from './pages/Events'
import { Home } from './pages/Home'
import { Planner } from './pages/Planner'
import { useFavorites, useHome, useRoute } from './store'

const nav = [
  ['', 'Home'],
  ['pujas', 'All pujos'],
  ['events', 'Events'],
  ['plan', 'Planner'],
  ['mine', 'My list'],
] as const

export default function App() {
  const route = useRoute()
  const [home, setHome] = useHome()
  const { favs, toggle } = useFavorites()
  const [path, query = ''] = route.split('?')
  const [section, arg] = path.split('/')

  let page
  if (section === 'puja' && arg) page = <Detail id={decodeURIComponent(arg)} home={home} favs={favs} toggle={toggle} />
  else if (section === 'pujas') page = <Directory home={home} favs={favs} toggle={toggle} />
  else if (section === 'mine') page = <Directory home={home} favs={favs} toggle={toggle} onlyFavs />
  else if (section === 'events') page = <Events home={home} />
  else if (section === 'plan') page = <Planner key={query} home={home} favs={favs} query={query} />
  else page = <Home home={home} setHome={setHome} favs={favs} toggle={toggle} />

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-amber-200 bg-amber-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <a href="#/" className="font-display text-xl font-bold text-red-800">
            🪔 Pujo Ghuri
          </a>
          <nav className="flex gap-1 text-sm">
            {nav.map(([to, label]) => (
              <a
                key={to}
                href={`#/${to}`}
                className={`rounded-full px-3 py-1.5 ${section === to || (to === 'pujas' && section === 'puja') ? 'bg-red-700 text-white' : 'text-stone-700 hover:bg-amber-100'}`}
              >
                {label}
                {to === 'mine' && favs.length > 0 && ` (${favs.length})`}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{page}</main>
      <footer className="border-t border-amber-200 bg-amber-50 py-6 text-center text-xs text-stone-600">
        <p>Made with ❤️ in San Jose by Sayantika.</p>
        <p className="mx-auto mt-1 max-w-2xl px-4">
          Schedules last checked {meta.lastVerified}. They change, so confirm with the organizer before you go.
        </p>
      </footer>
    </div>
  )
}
