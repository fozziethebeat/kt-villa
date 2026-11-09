# Hakuba Wake-Up (cozy-hakuba-cc)

A cozy van-life village-revival game set in Hakuba. See [DESIGN_DOC.md](DESIGN_DOC.md).

Requires Node 20.12+ (Vite 6 / Vitest 3 are pinned for Node 20; upgrading Node to 22 allows Vite 8).

```bash
npm install
npx playwright install chromium   # once, for e2e tests
npm run dev                        # http://localhost:5173 (game), /catalog.html (asset catalog)
npm test                           # unit tests (sim + asset manifest)
npm run balance                    # headless balance sim: earnings per build and season
npm run test:e2e                   # scripted playthrough + golden screenshots
npm run test:e2e:update            # re-baseline screenshots after intentional visual changes
```

Controls: WASD / arrows to walk, E to interact. Screenshots from the latest e2e run land in `test-results/shots/`.

Debug API (dev console): `__hakuba.summary()`, `setSeason('green')`, `setVitality('station', 3)`, `grant('yen', 500)`, `endDay()`, `warp(x, y)`, `startScene('Station')`,
`fastForward('station')` (finish a region's quests), `openRoad('snowpeak')`, `goto('snowpeak')` / `drive('snowpeak')`, `balance('winter')`.
