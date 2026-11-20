# Changelog

## 2.0.0

### Breaking changes

- Removed the unused `PaginatedResponse<T>` type. It duplicated `CiderResponse<T>`, which every
  method already returns. Replace `PaginatedResponse<Foo>` with `CiderResponse<LibraryPage<Foo>>`.
- Removed the unused `LibraryTrack` type, an empty alias of `TrackSummary`. Use `TrackSummary`
  for catalog tracks, or `PlaylistTrack` for library rows.
- `PlaylistTrack` no longer extends `TrackSummary`, so it no longer advertises an optional
  `durationInMillis`. Library song endpoints return `durationMs`; reading `durationInMillis` on
  these rows always yielded `undefined` at runtime. Use `durationMs`.
- Dropped the deep module files `src/types.ts`, `src/client.ts`, and `src/resources.ts`. The
  `exports` map only ever exposed the package root, so these were unreachable for consumers.
  Import everything from `cider-sdk`.

### Fixed

- Requests from a browser no longer fail with `TypeError: Illegal invocation`. The global `fetch`
  was stored on the client and invoked as a method of it, which browsers reject for anything but
  `Window`; it is now bound to `globalThis`. Node's `fetch` tolerated this, so the bug only
  surfaced in browsers.
- `plugins.install()` no longer aborts while the user is still looking at the consent dialog.
  Cider gives the user 3 minutes to respond, but the call used the 30s default timeout, so the
  client gave up first and the install could still land afterwards without the caller knowing.
  It now allows 185s, matching how `auth.requestToken()` already handled its 2-minute dialog.
- A request made with an already-aborted `AbortSignal` is now rejected before anything is sent.
  Previously the client relied on the `fetch` implementation to refuse it, so a custom
  `options.fetch` that ignores signals would still put the request on the wire.
- Playlist writes now allow 35s instead of 30s. Cider gives its frontend exactly 30s before
  answering `RPC_TIMEOUT`, so a client budget of 30s raced the server and often surfaced an
  opaque client abort instead of that actionable error.
- `requestAuthToken()` and `auth.requestToken()` now validate `app_name` (1-64 characters) and a
  non-empty `scopes` array before sending, as `createAuthLink()` already did, instead of spending
  a round trip to be told `400 INVALID_REQUEST`.
- Constructing a client on a runtime without `fetch` now throws a `TypeError` naming the problem,
  rather than failing later with `this.fetcher is not a function`.

### Added

- `CiderTimeoutError`, thrown when a request exceeds its timeout budget. Timeouts previously threw
  a bare `Error`, indistinguishable from a caller's abort without matching on the message. A
  request you abort yourself still rejects with your own abort reason.
- `createPluginInstallLink(zipUrl)`, which builds the `cider://install-plugin` deep link. It opens
  the same consent dialog on the device and needs no token or scope, mirroring `createAuthLink`.
- `NowPlayingStatus` and `PluginInstallResult`, so the return types of
  `library.nowPlayingStatus()` and `plugins.install()` can be named by consumers.
- `PlaybackStatus`, `RepeatStatus`, `AudioQuality`, and `PlaylistCreateResult` are now the declared
  return types of the matching methods. They were already exported but the controllers inlined
  identical shapes, leaving consumers no name to refer to.
- The canonical `*Controller` class names are exported from the package root alongside the existing
  `*Client` aliases. Only the aliases were reachable before.
- `engines: { node: ">=18" }`, since the client uses the global `fetch`, and `sideEffects: false`
  for bundler tree-shaking.

### Internal

- Added a test suite covering the transport, error mapping, timeout and abort behavior, auth
  validation, every controller's verbs and paths, and the event helper. `npm test` previously
  pointed at a `test/` directory that did not exist.
