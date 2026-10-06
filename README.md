# Pujo Ghuri · San Jose

A San Jose–centric guide to Bay Area Durga Puja 2026.

- **Home**: countdown, pujos open on the next pujo day, closest pujos to home, tithi calendar.
- **All pujos**: filter by date, region, drive time, free entry, bhog; list or map view.
- **Pujo pages**: schedule, cultural programs, bhog, tickets, directions from home.
- **Planner**: pick a date, time window, time per pujo and must-visits. It searches every visiting order (a small travelling-salesman problem with opening-hour windows) and returns the route with the most pujos and least driving. Share by link, copy, or WhatsApp.
- **My list**: star pujos; saved in the browser and sendable to the planner.
- **Home base**: defaults to downtown San Jose; change it to an address, zip, or your location (stored only in your browser).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npx vitest run   # planner tests
npm run build    # static site in dist/
```

## Data

`src/data/pujas.json` is adapted from an Apache-2.0 source (see `NOTICE`). Edit it and rebuild to update. Drive times are straight-line estimates, not live traffic.

## Deploy

Push to GitHub, then set **Settings → Pages → Source: GitHub Actions**. `.github/workflows/deploy.yml` builds and publishes `dist/`.
