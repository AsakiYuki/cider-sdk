# cider-sdk

A typed TypeScript client for Cider's local HTTP API. Read playback and library state, control playback and audio, edit playlists, access Apple Music and lyrics, and receive realtime playback events.

The client connects to `http://127.0.0.1:10767` by default. Cider must be running and reachable from your app.

## Install

```sh
npm install cider-sdk
```

```sh
pnpm add cider-sdk
yarn add cider-sdk
bun add cider-sdk
```

For realtime Socket.IO events, install the Socket.IO client in your application as well:

```sh
npm install socket.io-client
```

## Request an API token

The consent endpoint does not require an existing token. Ask the user to approve access in Cider, then pass the returned token to the client:

```ts
import { Cider, CiderScope, requestAuthToken } from "cider-sdk"

const { token, scopes } = await requestAuthToken({
	app_name: "My Cider App",
	scopes: [CiderScope.Playback, CiderScope.Library],
})

const cider = new Cider({ token })
console.log("Granted scopes:", scopes)
```

The user may grant only some of the requested scopes. Check the returned `scopes` before using scope protected endpoints.

For apps that need a same device consent link instead, use `createAuthLink`:

```ts
import { CiderScope, createAuthLink } from "cider-sdk"

const url = createAuthLink({
	appName: "My Cider App",
	scopes: [CiderScope.Playback],
	appImage: "https://example.com/icon.png",
})
// cider://request-auth?app-name=My+Cider+App&scopes=playback&app-image=...
```

You can also create API tokens in Cider under **Settings → Connectivity → API Tokens**.

## Basic usage

```ts
import { Cider } from "cider-sdk"

const cider = new Cider({ token: process.env.CIDER_API_TOKEN })

const playback = await cider.playback.get()
console.log(playback.data.nowPlaying?.name)

await cider.playback.pause()
await cider.playback.setRepeat("all")
await cider.audio.setVolume(0.5)

const queue = await cider.queue.list({ limit: 20 })
console.log(queue.data.items)

const playlists = await cider.library.playlists({ limit: 50 })
console.log(playlists.data.items, playlists.meta)
```

Successful API calls return Cider's response envelope, usually `{ data }`; paginated endpoints also include `meta`. API errors throw `CiderApiError` with `status`, `code`, and `message` fields.

The client accepts a custom API address, fetch implementation, and request timeout:

```ts
const cider = new Cider({
	token: process.env.CIDER_API_TOKEN,
	baseUrl: "http://192.168.1.20:10767",
	timeout: 30_000,
})
```

## Realtime playback events

Pass the Socket.IO `io` factory to the event helper. It connects to the same host using WebSocket with polling fallback. No API token is required for the `API:Playback` broadcast channel.

```ts
import { io } from "socket.io-client"
import { Cider } from "cider-sdk"

const cider = new Cider()
cider.events.connect(io)

const unsubscribe = cider.events.onPlayback(({ type, data }) => {
	if (type === "playerStatus.volumeDidChange") {
		console.log("Volume changed:", data)
	}
})

// When finished:
unsubscribe()
cider.events.disconnect()
```

`onPlayback` returns an unsubscribe function. Event payloads have the shape `{ type, data }`; use `cider.getEventsCatalog()` to inspect the running server's event and endpoint catalog.

## Available API groups

- `cider.playback` — now playing, transport controls, seeking, rate, repeat, shuffle, and autoplay.
- `cider.queue` — list, move, add, remove, and shuffle queue items.
- `cider.audio` — volume, crossfade, Automix, Atmos, Listening Mode, and capture settings.
- `cider.library` — browse library items and manage the current track's rating.
- `cider.playlists` — create and edit playlists, manage tracks, and use playlist history.
- `cider.amapi` — search and read Apple Music catalog resources through Cider.
- `cider.lyrics` — fetch lyrics, variations, translations, and language options.
- `cider.plugins` — request a plugin installation; Cider still asks the user to approve it.
- `cider.auth` — request a token or create an auth link.
- `cider.events` — connect to playback broadcasts.

The package also exports each controller, model, enum-like value, `CiderClient` (an alias for `Cider`), and the lower level `CiderHttpClient`.

## Build from source

```sh
npm install
npm run typecheck
npm run build
```

The build writes ESM files and declarations to `dist/esm`, and CommonJS files and declarations to `dist/cjs`.

## License

MIT
