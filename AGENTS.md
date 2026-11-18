# Cider API reference

Cider exposes a local HTTP API for reading and controlling a running client. The base URL is `http://127.0.0.1:10767`, and every request carries an `apptoken` header.

## Authentication

Request a token from Cider; the user approves it once, inside the app. Send that token as an `apptoken` header on every request. Each token carries a set of scopes that bound what it may access.

## Scopes

- `playback`: Control playback: play, pause, seek, skip, rate, repeat, shuffle, autoplay, and start specific content.
- `queue`: Read and modify the play queue: list, jump, add next/later, move, delete, shuffle, Smart Queue Optimizer.
- `library`: Browse your playlists, albums, artists, and songs, create and edit your playlists, and mark tracks as loved or disliked.
- `audio`: Audio features: volume, crossfade, Automix, Dolby Atmos, Listening Mode, and host-routed audio capture.
- `account`: Read your Apple Music developer token, user token, and storefront. Sensitive: grant only to apps that call the Apple Music API on your behalf.
- `plugins`: Request plugin installs. Each install still requires explicit per-plugin user consent via a dialog.
- `config`: Read-only snapshot of Cider's settings. Credentials are redacted and plugin settings are excluded.
- `lyrics`: Read lyrics, translations, and community lyric submissions for songs.

## Response format

Successful responses wrap the payload in a `data` field. Paginated endpoints add a `meta` object with `offset`, `limit`, and `total`.

```json
{ "data": ... }
```

```json
{ "data": [ ... ], "meta": { "offset": 0, "limit": 50, "total": 200 } }
```

Errors return an `error` object with a machine-readable `code` and a human-readable `message`.

```json
{ "error": { "code": "INVALID_REQUEST", "message": "..." } }
```

## Error codes

- `INVALID_REQUEST` (400): Malformed body / query / path params
- `UNAUTHORIZED_APP_TOKEN` (403): Missing or invalid apptoken header
- `INSUFFICIENT_SCOPE` (403): Token does not carry the required scope
- `AUTH_REQUEST_DENIED` (403): User denied the consent dialog
- `AUTH_REQUEST_TIMEOUT` (408): User did not respond within 2 min
- `AUTH_REQUEST_BUSY` (409): Another auth dialog is already pending
- `AUTH_REQUEST_COOLDOWN` (429): Same IP fired another request within 5 s
- `AUTH_REQUEST_BANNED` (429): Same IP hit 3 denials in 5 min → 15 min ban
- `AUTH_RESPONSE_MALFORMED` (500): Dialog returned unexpected shape (bug; file an issue)
- `PLUGIN_INSTALL_DENIED` (403): User denied the install dialog
- `PLUGIN_INSTALL_TIMEOUT` (408): User did not respond within 3 min
- `PLUGIN_INSTALL_BUSY` (409): Another install dialog is already pending
- `PLUGIN_INSTALL_COOLDOWN` (429): Same IP fired another install request within 2 s
- `PLUGIN_BAD_ZIP` (422): Downloaded file isn't a valid zip
- `PLUGIN_BAD_MANIFEST` (422): plugin.yml missing / malformed / missing identifier
- `PLUGIN_DOWNLOAD_FAILED` (502): URL unreachable or returned non-200
- `PLUGIN_INSTALL_FAILED` (500): Extraction / filesystem error after consent
- `CONFIG_PATH_NOT_FOUND` (404): ?path= does not match any config key
- `CAPABILITY_UNAVAILABLE` (409): The running backend lacks a capability the endpoint requires (e.g. host audio capture is Windows / .NET host only)
- `LYRICS_NOT_FOUND` (404): No provider returned lyrics for the track
- `NO_CURRENT_TRACK` (404): Nothing is playing
- `LYRICS_VARIATION_NOT_FOUND` (404): Unknown community lyric variation id
- `LYRICS_TRANSLATIONS_NOT_FOUND` (404): No translation for that language: it may still be generating, retry later
- `LYRICS_TIMEOUT` (504): Lyric providers did not respond within the fetch budget
- `INVALID_TTML` (400): Community lyrics: the submitted TTML could not be parsed
- `OWN_VARIATION` (400): Community lyrics: you cannot suggest an edit to your own variation
- `TRACK_UNSHAREABLE` (400): Community lyrics: the track's metadata is too generic to share, so it takes no suggestions
- `NO_CHANGE` (400): Community lyrics: the suggestion is identical to the revision it is based on
- `LAYER_KEYS_MISMATCH` (400): Community lyrics: a layer names line keys the variation's head revision does not have
- `PROFILE_REQUIRED` (403): Community lyrics: set up a contributor profile (vanity name) first
- `STALE_BASE` (409): Community lyrics: the variation moved on since baseRevisionId; the body carries the current headRevisionId
- `SUGGESTION_OUTDATED` (409): Community lyrics: the variation moved on since the suggestion was made
- `SUGGESTION_NOT_PENDING` (409): Community lyrics: the suggestion was already accepted, rejected, withdrawn or has expired
- `TTML_TOO_LARGE` (413): Community lyrics: the TTML is over the 512 KB cap
- `RATE_LIMITED` (429): Community lyrics: too many writes or reports; see Retry-After when present
- `SUGGESTION_LIMIT` (429): Community lyrics: too many pending suggestions, from you or on that variation
- `AMAPI_ERROR` (502): Apple Music returned an error (the status mirrors Apple's, e.g. 401/404/429)
- `RPC_TIMEOUT` (504): Frontend did not respond within 30 s
- `PLAYLIST_NOT_FOUND` (404): No editable playlist with that id
- `HISTORY_ENTRY_NOT_FOUND` (404): No Playlist Time Machine snapshot with that timestamp
- `PLAYLIST_NOT_EDITABLE` (403): The playlist is not owned or editable by this account
- `PLAYLIST_IS_SMART` (409): Smart (rule-managed) playlists reject direct track or description edits
- `PLAYLIST_CONFLICT` (409): The playlist changed between read and write (optimistic lastModifiedDate check)
- `TRACK_COUNT_MISMATCH` (409): PUT /tracks expectedTrackCount did not match the server's current count
- `INVALID_TRACK_REF` (400): A track ref was malformed or a move index was out of range
- `CATALOG_IMPORT_NOT_ALLOWED` (400): A catalog ref (songs / music-videos) was sent without allowLibraryImport: true
- `SNAPSHOT_FAILED` (503): The pre-write snapshot could not be recorded, so the write was refused and nothing changed
- `WRITE_FAILED` (502): The underlying Apple Music playlist write failed
- `PLAYLIST_WRITE_RATE_LIMITED` (429): Too many playlist writes in the sliding window (see Retry-After)
- `RPC_INVALID_RESULT` (500): The renderer returned an unexpected result for a playlist operation

## Endpoints

### Auth

**How authorization works.** Your app needs a token to talk to Cider. The user approves that token once, right inside Cider, and from then on you send it with every request in an `apptoken` header.

**The simplest way to get one:** click **Connect to Cider** in the connection panel at the bottom-right of this page. It walks through everything below for you and drops a working token into the live sandbox.

When you're building your own app, there are three ways to get a token:

1. **Ask Cider for a token directly (recommended).** Your app calls `POST /api/v2/auth/request` (documented below). Cider shows the user a consent dialog, and when they approve, the token comes straight back in the response, so there is nothing to copy by hand. This works whether your app runs on the same machine as Cider or across the network, and because you get a clean request and response callback it is much easier to handle than the link method. Reach for this whenever your app can make an HTTP request.
2. **Open a quick link (same device).** Your app opens a `cider://request-auth` deep link and Cider pops the same consent dialog; on approval it shows the token on screen for the user to paste into your app. Use this when your app cannot make the HTTP call itself, and you handle the paste.

   ```
   cider://request-auth?app-name=<name>&scopes=<csv>&app-image=<url>
   ```

3. **Create one by hand in Cider's settings.** The user opens **Settings → Connectivity → API Tokens → Create New**, names it, ticks the scopes it should have, and copies the token into your app. No code on your side.

A note for older setups: tokens made before scopes existed don't list any scopes, so Cider kindly treats them as having access to everything.

#### POST /api/v2/auth/request

Ask Cider for a token directly, with no token needed to make the request. This is the recommended way to get one: Cider shows the user a consent dialog, and if they approve, the token comes straight back in the response, so there is nothing to copy by hand. It works whether your app runs on the same machine as Cider or across the network. The request waits until the user responds, or until the 2-minute timeout runs out.

**Scope:** none

**Parameters:**

- `app_name` (body, string, required): 1-64 chars; shown in the consent dialog
- `app_image` (body, string): https:// URL or data:image/… (≤ 128 KB); falls back to a generic lock icon on error
- `scopes` (body, string[], required): Non-empty subset of the 8 known scopes

**Request body:**

```json
{
	"app_name": "Remote Dashboard",
	"app_image": "https://example.com/logo.png",
	"scopes": ["playback", "library"]
}
```

**Example response:**

```json
{
	"data": {
		"token": "nhtvzkuhkxulg1w11zfd4ixq",
		"scopes": ["playback", "library"]
	}
}
```

**Errors:**

- `INVALID_REQUEST` (400): Body shape bad, unknown scope, or empty scopes array
- `AUTH_REQUEST_DENIED` (403): User denied the consent dialog
- `AUTH_REQUEST_TIMEOUT` (408): User did not respond within 2 min
- `AUTH_REQUEST_BUSY` (409): Another auth dialog is already pending
- `AUTH_REQUEST_COOLDOWN` (429): Same IP fired another request within 5 s
- `AUTH_REQUEST_BANNED` (429): Same IP hit 3 denials in 5 min → 15 min ban
- `AUTH_RESPONSE_MALFORMED` (500): Dialog returned unexpected shape (bug; file an issue)

The returned `scopes` may be a **subset** of the requested ones if the user unchecked some in the dialog. Store the token and send it on subsequent calls via the `apptoken` header.

Rate limits (per IP, in-memory, cleared on Cider restart): 5 s cooldown between requests, 3 denials in 5 min → 15 min ban, one pending dialog globally, 2 min user-response timeout. `429` responses include a `Retry-After: <seconds>` header.

### Client

Basic facts about the running Cider app, plus its Apple Music credentials. Start here to confirm you can reach Cider before calling anything else.

#### GET /api/v2/client/info

Get the running app's version and platform. Because it needs no particular scope, this is the safe first call to confirm Cider is up and reachable before you do anything else.

**Scope:** none

**Example response:**

```json
{
	"data": {
		"framework": "dotnet",
		"platform": "win32",
		"osVersion": "10.0.22631",
		"port": 10767,
		"production": true,
		"version": "4.0.0"
	}
}
```

Framework values: `dotnet`, `genten`, `universal`. Platform values: `win32`, `darwin`, `linux`, `web`.

#### GET /api/v2/client/tokens

Get the raw Apple Music credentials (developer token, user token, and storefront). This is a last resort: most apps should query Apple Music through the Apple Music (amapi) endpoints instead, which never expose a token. Needs the `account` scope.

**Scope:** `account`

**Example response:**

```json
{
	"data": {
		"developerToken": "eyJ…",
		"userToken": "A…",
		"storefront": "us"
	}
}
```

> Handle with care. The user token is a bearer credential for the user's entire Apple Music account and is not tied to any origin, so anyone who gets a copy can act as that user until it is revoked. Only reach for this if you truly need the raw token and can store it securely; otherwise use the **Apple Music** proxy endpoints, which let you read the catalog and library without ever holding a credential. Only grant `account` to apps that genuinely need it.

### Playback

Everything about what Cider is playing: read the current track and position, control play/pause/skip, start something new, and set repeat, shuffle, and autoplay.

#### GET /api/v2/playback

Get everything about what's playing right now in one call: the track, how far into it you are, the volume, and the repeat, shuffle, autoplay, and speed settings. Handy for painting a whole now-playing UI from a single request.

**Scope:** `playback`

**Example response:**

```json
{
	"data": {
		"state": "playing",
		"nowPlaying": {
			"name": "Song Title",
			"artistName": "Artist",
			"albumName": "Album",
			"artwork": { "url": "https://…", "width": 600, "height": 600 },
			"durationInMillis": 240000,
			"inFavorites": true,
			"inLibrary": true,
			"flavor": "256"
		},
		"time": { "currentTime": 45.2, "duration": 240, "remaining": 194.8 },
		"volume": 0.75,
		"repeatMode": "none",
		"shuffleMode": false,
		"autoplay": true,
		"rate": 1.0
	}
}
```

#### GET /api/v2/playback/now-playing

Get the details of the current track (title, artist, album, artwork) plus whether it is in your library and favorited. Use this when you only need the song, not the full player state.

**Scope:** `playback`

#### GET /api/v2/playback/state

Check whether Cider is playing, paused, or stopped. The lightest way to tell if music is running right now.

**Scope:** `playback`

**Example response:**

```json
{ "data": { "state": "playing" } }
```

Values: `playing`, `paused`, `stopped`.

#### GET /api/v2/playback/time

Get how far into the current track you are, in seconds, along with its total length and how much is left. Good for drawing a progress bar.

**Scope:** `playback`

**Example response:**

```json
{ "data": { "currentTime": 45.2, "duration": 240, "remaining": 194.8 } }
```

#### GET /api/v2/playback/audio-quality

Find out the audio quality and codec of what's playing, plus what the current device supports. When a local file is playing, its details show up under localPlayback.

**Scope:** `playback`

**Example response:**

```json
{
	"data": {
		"flavor": "256",
		"flavorLabel": "AAC 256kbps",
		"deviceAudioConfig": {
			"channelCount": 2,
			"sampleRate": 48000,
			"supportsAtmos": true,
			"supportedCodecs": ["AAC", "E-AC-3", "E-AC-3 JOC (Atmos)"]
		},
		"localPlayback": null
	}
}
```

Flavor values: `64`, `256`, `bin_64`, `bin_256`, `atmos`, `unk`, `local_lossless`, `local_<bitrate>`.

#### POST /api/v2/playback/play

Start playing again after a pause. Picks up wherever the current track left off.

**Scope:** `playback`

#### POST /api/v2/playback/pause

Pause playback, keeping your place in the current track so you can resume later.

**Scope:** `playback`

#### POST /api/v2/playback/stop

Stop playback entirely. Unlike pause, this clears the now-playing track rather than holding your spot.

**Scope:** `playback`

#### POST /api/v2/playback/toggle

Flip between playing and paused in one call, so you don't have to check the current state first. Perfect for a single play/pause button.

**Scope:** `playback`

#### POST /api/v2/playback/next

Skip to the next track in the queue.

**Scope:** `playback`

#### POST /api/v2/playback/previous

Go back a track. If you are more than 3 seconds into the current song, this restarts it from the beginning instead, matching how a physical back button feels. Pass force to always jump to the previous track.

**Scope:** `playback`

**Parameters:**

- `force` (body, boolean): Always go to the previous track instead of restarting the current one

#### POST /api/v2/playback/seek

Jump to a specific spot in the current track, in seconds. Use it to scrub forward or back.

**Scope:** `playback`

**Parameters:**

- `position` (body, number, required) [min: 0]: Position in seconds

**Request body:**

```json
{ "position": 45.5 }
```

#### POST /api/v2/playback/play-item

Start playing a single catalog item, like a song or music video, by its type and id. This is the go-to way to play one specific thing.

**Scope:** `playback`

**Parameters:**

- `type` (body, string, required): MusicKit resource type
- `id` (body, string, required): Catalog id

**Request body:**

```json
{ "type": "songs", "id": "1234567890" }
```

#### POST /api/v2/playback/play-id

Same as /playback/play-item, just a differently named alias. Use whichever path reads better in your code; the body and behavior are identical.

**Scope:** `playback`

**Parameters:**

- `type` (body, string, required): MusicKit resource type
- `id` (body, string, required): Catalog id

**Request body:**

```json
{ "type": "songs", "id": "1234567890" }
```

#### POST /api/v2/playback/play-url

Play whatever an Apple Music share link points to. Paste a music.apple.com URL and Cider figures out the song, album, or playlist for you.

**Scope:** `playback`

**Parameters:**

- `url` (body, string, required): Apple Music URL

**Request body:**

```json
{ "url": "https://music.apple.com/…" }
```

#### POST /api/v2/playback/play-href

Play content from a raw MusicKit href (the /v1/catalog/… path the Apple Music API returns). Useful when you already have a href in hand from another API call.

**Scope:** `playback`

**Parameters:**

- `href` (body, string, required): MusicKit resource href

**Request body:**

```json
{ "href": "/v1/catalog/us/songs/1234567890" }
```

#### POST /api/v2/playback/play-collection

Play a whole album, playlist, or station from the start, and optionally shuffle it. Reach for this when you want to queue up a full collection rather than a single track.

**Scope:** `playback`

**Parameters:**

- `type` (body, enum, required) [enum: albums | playlists | stations]: Collection type
- `id` (body, string, required): Collection id
- `shuffle` (body, boolean) [default: false]: Start shuffled

**Request body:**

```json
{ "type": "albums", "id": "1234567890", "shuffle": false }
```

This one is asynchronous: resolving and loading the collection takes a few seconds before playback starts.

#### GET /api/v2/playback/rate

Read how fast the track is playing. 1.0 is normal speed; higher is faster, lower is slower.

**Scope:** `playback`

**Example response:**

```json
{ "data": { "rate": 1.0 } }
```

#### PATCH /api/v2/playback/rate

Speed up or slow down playback without changing the pitch, from a quarter speed up to 4x. Great for podcasts or spoken-word content.

**Scope:** `playback`

**Parameters:**

- `rate` (body, number, required) [min: 0.25, max: 4]: Playback rate multiplier

**Request body:**

```json
{ "rate": 1.5 }
```

#### GET /api/v2/playback/repeat

Check whether repeat is off, repeating one track, or repeating the whole queue.

**Scope:** `playback`

**Example response:**

```json
{ "data": { "mode": "none" } }
```

Values: `none`, `one`, `all`.

#### PUT /api/v2/playback/repeat

Set repeat straight to off, one track, or the whole queue, without cycling through the other modes to get there.

**Scope:** `playback`

**Parameters:**

- `mode` (body, enum, required) [enum: none | one | all]: Repeat mode

**Request body:**

```json
{ "mode": "all" }
```

#### POST /api/v2/playback/repeat/toggle

Step to the next repeat mode in the usual cycle: off, then one track, then the whole queue, then back to off. Matches tapping the repeat button in the player.

**Scope:** `playback`

#### GET /api/v2/playback/shuffle

Check whether shuffle is currently on or off.

**Scope:** `playback`

**Example response:**

```json
{ "data": { "enabled": false } }
```

#### PUT /api/v2/playback/shuffle

Turn shuffle on or off directly, when you know exactly which state you want.

**Scope:** `playback`

**Parameters:**

- `enabled` (body, boolean, required): Shuffle on/off

**Request body:**

```json
{ "enabled": true }
```

#### POST /api/v2/playback/shuffle/toggle

Flip shuffle to the opposite of whatever it is now. Ideal for a single shuffle button.

**Scope:** `playback`

#### GET /api/v2/playback/autoplay

Check whether autoplay (Infinity) is on, which keeps similar music going once the queue runs out.

**Scope:** `playback`

**Example response:**

```json
{ "data": { "enabled": true } }
```

#### PUT /api/v2/playback/autoplay

Turn autoplay (Infinity) on or off directly. When on, Cider keeps playing related tracks after your queue ends.

**Scope:** `playback`

**Parameters:**

- `enabled` (body, boolean, required): Autoplay on/off

**Request body:**

```json
{ "enabled": false }
```

#### POST /api/v2/playback/autoplay/toggle

Flip autoplay (Infinity) on or off in one call.

**Scope:** `playback`

### Queue

See what's lined up to play next and change it: read the queue, add songs, jump around, reorder, and shuffle. The queue lives on your device, so paging isn't capped by Apple Music's 100-item limit; `limit` goes up to 200.

#### GET /api/v2/queue

List the songs waiting to play, one page at a time, with where each one came from (a playlist, album, and so on) and which track is playing now.

**Scope:** `queue`

**Parameters:**

- `offset` (query, integer) [default: 0, min: 0]: Items to skip
- `limit` (query, integer) [default: 50, min: 1, max: 200]: Page size (max 200; the queue is local, not Apple-capped)

**Example response:**

```json
{
  "data": {
    "items": [
      {
        "track": { "id": "123", "type": "songs", "attributes": { … } },
        "source": "user",
        "containerContext": {
          "type": "playlist", "id": "pl.abc", "name": "My Playlist"
        }
      }
    ],
    "position": 3
  },
  "meta": { "offset": 0, "limit": 50, "total": 120 }
}
```

#### GET /api/v2/queue/position

Get which track in the queue is playing now and how many tracks there are in total. A quick way to show "song 3 of 120".

**Scope:** `queue`

**Example response:**

```json
{ "data": { "position": 3, "total": 120 } }
```

#### POST /api/v2/queue/jump

Skip straight to a specific song in the queue by its position, instead of pressing next repeatedly.

**Scope:** `queue`

**Parameters:**

- `index` (body, integer, required) [min: 0]: Queue index to jump to

**Request body:**

```json
{ "index": 5 }
```

#### POST /api/v2/queue/add-next

Slot a song in to play right after the current one, like the "Play Next" option in the app.

**Scope:** `queue`

**Parameters:**

- `type` (body, string, required): MusicKit resource type
- `id` (body, string, required): Catalog id

**Request body:**

```json
{ "type": "songs", "id": "1234567890" }
```

#### POST /api/v2/queue/add-later

Add a song to the very end of the queue, like "Play Later".

**Scope:** `queue`

**Parameters:**

- `type` (body, string, required): MusicKit resource type
- `id` (body, string, required): Catalog id

**Request body:**

```json
{ "type": "songs", "id": "1234567890" }
```

#### DELETE /api/v2/queue/items/:index

Remove a single song from the queue by its position.

**Scope:** `queue`

**Parameters:**

- `index` (path, integer, required) [min: 0]: Queue index to remove

#### POST /api/v2/queue/move

Reorder the queue by moving a song from one position to another, the way dragging a row up or down would.

**Scope:** `queue`

**Parameters:**

- `from` (body, integer, required) [min: 0]: Source index
- `to` (body, integer, required) [min: 0]: Destination index

**Request body:**

```json
{ "from": 5, "to": 2 }
```

#### DELETE /api/v2/queue

Empty the queue completely, removing every upcoming song.

**Scope:** `queue`

#### POST /api/v2/queue/shuffle

Shuffle the order of the songs currently in the queue.

**Scope:** `queue`

#### GET /api/v2/queue/smart-optimizer

Check on the Smart Queue Optimizer, which reorders upcoming songs for smoother transitions. Tells you if it is on and whether it is still working.

**Scope:** `queue`

**Example response:**

```json
{ "data": { "enabled": true, "busy": false, "pending": 0, "message": null } }
```

#### POST /api/v2/queue/smart-optimizer/toggle

Turn the Smart Queue Optimizer on or off.

**Scope:** `queue`

Requires Automix to be enabled.

### Audio

Read and adjust how Cider sounds: volume, crossfade, Automix, Dolby Atmos, Listening Mode, and host-routed audio capture. The PATCH endpoints only change the fields you send, so you can tweak one setting and leave the rest alone.

#### GET /api/v2/audio/volume

Read the current volume, from 0 (muted) to 1 (full).

**Scope:** `audio`

**Example response:**

```json
{ "data": { "volume": 0.75 } }
```

#### PATCH /api/v2/audio/volume

Set the volume to a value between 0 (muted) and 1 (full).

**Scope:** `audio`

**Parameters:**

- `volume` (body, number, required) [min: 0, max: 1]: Volume, 0.0-1.0

**Request body:**

```json
{ "volume": 0.5 }
```

#### GET /api/v2/audio/crossfade

Read the crossfade settings (which blend the end of one song into the start of the next), including whether it is actually active right now and which kinds of content are excluded.

**Scope:** `audio`

**Example response:**

```json
{
	"data": {
		"enabled": true,
		"effectiveEnabled": true,
		"durationSec": 5,
		"skipEnabled": false,
		"tempoSensitivity": 0.6,
		"loudnessSensitivity": 0.75,
		"exclusions": {
			"albums": false,
			"playlists": false,
			"djMixes": true,
			"liveAlbums": true
		}
	}
}
```

#### PATCH /api/v2/audio/crossfade

Change one or more crossfade settings, such as turning it on, setting how long the blend lasts, or excluding albums. Only the fields you include are updated.

**Scope:** `audio`

**Parameters:**

- `enabled` (body, boolean): Turn crossfade on/off
- `durationSec` (body, number): Crossfade duration in seconds
- `skipEnabled` (body, boolean): Also crossfade on manual skips
- `tempoSensitivity` (body, number) [min: 0, max: 1]: Tempo sensitivity, 0-1
- `loudnessSensitivity` (body, number) [min: 0, max: 1]: Loudness sensitivity, 0-1
- `exclusions` (body, object): Partial exclusions update: albums, playlists, djMixes, liveAlbums (booleans)

**Request body:**

```json
{ "enabled": true, "durationSec": 8, "exclusions": { "albums": true } }
```

#### GET /api/v2/audio/automix

Read the Automix settings (Cider’s DJ-style transitions between songs), including whether it is active right now and what is excluded.

**Scope:** `audio`

**Example response:**

```json
{
	"data": {
		"enabled": true,
		"effectiveEnabled": true,
		"energyBoost": false,
		"normalizeDurationMs": 4000,
		"exclusions": { "albums": false, "playlists": false, "djMixes": true, "liveAlbums": true }
	}
}
```

#### PATCH /api/v2/audio/automix

Change one or more Automix settings, like turning it on or adjusting the energy boost. Only the fields you send are updated.

**Scope:** `audio`

**Parameters:**

- `enabled` (body, boolean): Turn automix on/off
- `energyBoost` (body, boolean): Energy boost on transitions
- `normalizeDurationMs` (body, integer): Normalize duration in milliseconds
- `exclusions` (body, object): Partial exclusions update: albums, playlists, djMixes, liveAlbums (booleans)

**Request body:**

```json
{ "energyBoost": true, "normalizeDurationMs": 6000 }
```

#### GET /api/v2/audio/atmos

Read the Dolby Atmos spatial-audio settings, including whether binaural rendering is on and your per-device preferences.

**Scope:** `audio`

**Example response:**

```json
{
	"data": {
		"enabled": true,
		"binaural": true,
		"devicePreferences": { "default": "binaural" }
	}
}
```

#### PATCH /api/v2/audio/atmos

Change one or more Dolby Atmos settings, such as turning Atmos on or switching binaural rendering. Only the fields you include are updated.

**Scope:** `audio`

**Parameters:**

- `enabled` (body, boolean): Turn Atmos on/off
- `binaural` (body, boolean): Binaural rendering on/off
- `devicePreferences` (body, object): Per-device rendering preferences

**Request body:**

```json
{ "enabled": true, "binaural": false }
```

#### GET /api/v2/audio/listening-mode

Read the Listening Mode preset (post-pipeline EQ/trim). `available` is false while Dolby Atmos passthrough is active.

**Scope:** `audio`

**Example response:**

```json
{ "data": { "mode": "off", "available": true } }
```

#### PATCH /api/v2/audio/listening-mode

Switch the Listening Mode preset. Takes effect only when Atmos passthrough is not active.

**Scope:** `audio`

**Parameters:**

- `mode` (body, enum, required) [enum: off | game | antifatigue]: Listening Mode preset

**Request body:**

```json
{ "mode": "game" }
```

#### GET /api/v2/audio/capture

Read host-routed audio capture state. `supported` is true only on the Windows / .NET host that can capture Cider’s audio.

**Scope:** `audio`

**Example response:**

```json
{
	"data": {
		"supported": true,
		"mode": "capture",
		"gainDb": 0,
		"autoEnable": true,
		"autoApps": ["obs64", "discord"],
		"exclusive": { "sampleRate": 0, "bitDepth": 0 }
	}
}
```

#### PATCH /api/v2/audio/capture

Change host-routed audio capture: pick a mode, set the output trim, auto-capture apps, or the exclusive output format. Windows / .NET host only; only the fields you send are updated.

**Scope:** `audio`

**Parameters:**

- `mode` (body, enum) [enum: off | capture | exclusive]: off = normal output; capture = WASAPI shared session so OBS/Discord can record Cider; exclusive = bit-transparent to the DAC, not capturable
- `gainDb` (body, number) [min: -24, max: 12]: Output trim in dB applied by the host renderer
- `autoEnable` (body, boolean): Capture mode: auto-enable only while a watched app is running
- `autoApps` (body, string[]): Process base-names to watch (lowercase, no extension)
- `exclusive` (body, object): Exclusive-mode output format: sampleRate (0 = match source, else 48000/88200/96000/176400/192000) and bitDepth (0 = auto, else 16/24/32)

**Request body:**

```json
{ "mode": "exclusive", "exclusive": { "sampleRate": 96000, "bitDepth": 24 } }
```

**Errors:**

- `CAPABILITY_UNAVAILABLE` (409): The running backend lacks a capability the endpoint requires (e.g. host audio capture is Windows / .NET host only)

### Library

Browse the music you've saved and manage the song playing now: list your playlists, albums, artists, and songs, and add, remove, love, dislike, or rate the current track.

Listing endpoints return a `{ data: { items }, meta: { offset, limit, total } }` shape and take `offset` / `limit` query params (default 0 / 50, **max 100**: Apple Music caps library pages at 100, and higher values return `400 INVALID_REQUEST`).

**Artwork URLs come ready to use**: there are no `{w}`/`{h}` placeholders left to fill in, so you can drop the URL straight into an `<img src>`.

#### GET /api/v2/library/now-playing/status

Check whether the current track is saved to your library and how you have rated it (loved, disliked, or neither).

**Scope:** `library`

**Example response:**

```json
{ "data": { "inLibrary": true, "rating": 1 } }
```

Rating is `-1` (dislike), `0` (none), or `1` (love).

#### POST /api/v2/library/now-playing/add

Save the track playing right now to your library.

**Scope:** `library`

#### DELETE /api/v2/library/now-playing

Remove the track playing right now from your library.

**Scope:** `library`

#### POST /api/v2/library/now-playing/love

Love the current track (sets its rating to 1), just like tapping the heart.

**Scope:** `library`

#### POST /api/v2/library/now-playing/dislike

Dislike the current track (sets its rating to -1) and skip to the next song, the way the suggest-less control works in the app.

**Scope:** `library`

#### DELETE /api/v2/library/now-playing/rating

Clear any love or dislike on the current track, returning it to no rating.

**Scope:** `library`

#### PUT /api/v2/library/now-playing/rating

Set the rating on the current track directly: -1 to dislike, 0 to clear, or 1 to love.

**Scope:** `library`

**Parameters:**

- `rating` (body, integer, required) [min: -1, max: 1]: Values: -1 (dislike), 0 (none), 1 (love)

**Request body:**

```json
{ "rating": 1 }
```

#### GET /api/v2/library/playlists

List the playlists saved in your library, a page at a time.

**Scope:** `library`

**Parameters:**

- `offset` (query, integer) [default: 0, min: 0]: Items to skip
- `limit` (query, integer) [default: 50, min: 1, max: 100]: Page size (max 100: Apple Music caps library pages at 100; higher values return 400 INVALID_REQUEST)

**Example response:**

```json
{
	"data": {
		"items": [
			{
				"id": "p.xxx",
				"name": "Coffeehouse",
				"description": "Slow mornings",
				"canEdit": true,
				"trackCount": 42,
				"artwork": { "url": "https://…", "width": 600, "height": 600 }
			}
		]
	},
	"meta": { "offset": 0, "limit": 50, "total": 84 }
}
```

**Errors:**

- `INVALID_REQUEST` (400): Invalid pagination parameters: limit must be 1-100 (Apple Music library caps pages at 100)

#### GET /api/v2/library/playlists/:id/songs

List the songs in one of your library playlists, a page at a time.

**Scope:** `library`

**Parameters:**

- `id` (path, string, required): Library playlist id
- `offset` (query, integer) [default: 0, min: 0]: Items to skip
- `limit` (query, integer) [default: 50, min: 1, max: 100]: Page size (max 100: Apple Music caps library pages at 100; higher values return 400 INVALID_REQUEST)

**Errors:**

- `INVALID_REQUEST` (400): Invalid pagination parameters: limit must be 1-100 (Apple Music library caps pages at 100)

Each item has `id`, `name`, `artistName`, `albumName`, `durationMs`, `trackNumber`, `artwork`.

#### GET /api/v2/library/albums

List the albums saved in your library, a page at a time.

**Scope:** `library`

**Parameters:**

- `offset` (query, integer) [default: 0, min: 0]: Items to skip
- `limit` (query, integer) [default: 50, min: 1, max: 100]: Page size (max 100: Apple Music caps library pages at 100; higher values return 400 INVALID_REQUEST)

**Errors:**

- `INVALID_REQUEST` (400): Invalid pagination parameters: limit must be 1-100 (Apple Music library caps pages at 100)

Each item has `id`, `name`, `artistName`, `trackCount`, `releaseDate`, `artwork`.

#### GET /api/v2/library/albums/:id/songs

List the songs on one of your library albums, a page at a time.

**Scope:** `library`

**Parameters:**

- `id` (path, string, required): Library album id
- `offset` (query, integer) [default: 0, min: 0]: Items to skip
- `limit` (query, integer) [default: 50, min: 1, max: 100]: Page size (max 100: Apple Music caps library pages at 100; higher values return 400 INVALID_REQUEST)

**Errors:**

- `INVALID_REQUEST` (400): Invalid pagination parameters: limit must be 1-100 (Apple Music library caps pages at 100)

Same shape as playlist songs.

#### GET /api/v2/library/artists

List the artists in your library, a page at a time.

**Scope:** `library`

**Parameters:**

- `offset` (query, integer) [default: 0, min: 0]: Items to skip
- `limit` (query, integer) [default: 50, min: 1, max: 100]: Page size (max 100: Apple Music caps library pages at 100; higher values return 400 INVALID_REQUEST)

**Errors:**

- `INVALID_REQUEST` (400): Invalid pagination parameters: limit must be 1-100 (Apple Music library caps pages at 100)

Each item has `id`, `name`, `artwork`.

#### GET /api/v2/library/artists/:id/albums

List the albums by one artist in your library, a page at a time.

**Scope:** `library`

**Parameters:**

- `id` (path, string, required): Library artist id
- `offset` (query, integer) [default: 0, min: 0]: Items to skip
- `limit` (query, integer) [default: 50, min: 1, max: 100]: Page size (max 100: Apple Music caps library pages at 100; higher values return 400 INVALID_REQUEST)

**Errors:**

- `INVALID_REQUEST` (400): Invalid pagination parameters: limit must be 1-100 (Apple Music library caps pages at 100)

Same shape as `/library/albums`.

#### GET /api/v2/library/songs

List every song in your library (the Songs tab), a page at a time.

**Scope:** `library`

**Parameters:**

- `offset` (query, integer) [default: 0, min: 0]: Items to skip
- `limit` (query, integer) [default: 50, min: 1, max: 100]: Page size (max 100: Apple Music caps library pages at 100; higher values return 400 INVALID_REQUEST)

**Errors:**

- `INVALID_REQUEST` (400): Invalid pagination parameters: limit must be 1-100 (Apple Music library caps pages at 100)

Same shape as playlist songs.

#### GET /api/v2/library/recently-added

Your recently added albums and playlists, newest first, the same as the Library → Recently Added screen.

**Scope:** `library`

**Parameters:**

- `offset` (query, integer) [default: 0, min: 0]: Items to skip
- `limit` (query, integer) [default: 50, min: 1, max: 100]: Page size (max 100: Apple Music caps library pages at 100; higher values return 400 INVALID_REQUEST)

**Example response:**

```json
{
	"data": {
		"items": [
			{
				"type": "library-albums",
				"id": "l.4nBhblq",
				"name": "In Rainbows",
				"artistName": "Radiohead",
				"trackCount": 10,
				"releaseDate": "2007-10-10",
				"artwork": { "url": "https://…", "width": 600, "height": 600 }
			},
			{
				"type": "library-playlists",
				"id": "p.xxx",
				"name": "Coffeehouse",
				"description": "Slow mornings",
				"canEdit": true,
				"trackCount": 42,
				"artwork": { "url": "https://…", "width": 600, "height": 600 }
			}
		]
	},
	"meta": { "offset": 0, "limit": 50, "total": 128 }
}
```

**Errors:**

- `INVALID_REQUEST` (400): Invalid pagination parameters: limit must be 1-100 (Apple Music library caps pages at 100)

A mixed feed: each item carries a `type` of `library-albums` or `library-playlists`. Albums use the `/library/albums` item shape and playlists use the `/library/playlists` item shape.

### Playlists

Create playlists and edit their tracks and metadata. These are the write counterparts to the read-only Library listing endpoints, and they lead with one guarantee.

**Playlist Time Machine.** Before any write, Cider snapshots the playlist's current track list. The snapshot is awaited and fail-closed in two ways: the pre-image must be provably complete (its length is checked against the playlist's track count, and a short read is refused with `503 SNAPSHOT_FAILED`), and it must then be durably recorded and read back (a snapshot that cannot be confirmed is likewise refused with `503 SNAPSHOT_FAILED`). In either case nothing changes. Every track write returns a `snapshotAt` restore point you can feed to `POST /playlists/:id/history/restore` to roll back. History is a shallow FIFO (default 10 entries per playlist), which is why writes are rate-limited: a runaway client could otherwise evict the very snapshot you want.

**Replace and delete cannot truncate.** `PUT /playlists/:id/tracks` requires `expectedTrackCount`, checked against the server's current count, so a stale count is rejected. `DELETE /playlists/:id/tracks` builds its new list by removing from the complete pre-image above, so a partial read fails closed rather than dropping the tracks it never saw. Passing `tracks: []` to replace is a deliberate clear-all, which is exactly why the count is mandatory.

**A write timeout is ambiguous.** Playlist writes get a 120-second budget; on timeout the API returns `504 RPC_TIMEOUT`, but the Apple write may still land afterward. That is the opposite of `503 SNAPSHOT_FAILED`, where nothing changed and a retry is safe. Because `POST /playlists/:id/tracks` is a non-idempotent append, retrying a `504` blindly can double-add tracks, so re-read the playlist or `GET /playlists/:id/history` first.

**Catalog tracks opt in.** A track ref is either a library ref (`library-songs`, `library-music-videos`) or a catalog ref (`songs`, `music-videos`). Apple imports a catalog track into your library as a side effect of adding it, so catalog refs require `allowLibraryImport: true`.

**No delete, plus concurrency.** There is deliberately no `DELETE /playlists/:id`. The Time Machine restores tracks into a playlist that still exists; it cannot resurrect a deleted one. Playlist deletion is a design-level omission, not a gap. Smart playlists reject track writes with `409 PLAYLIST_IS_SMART`. Remove, reorder, replace, and restore carry an optimistic `lastModifiedDate` check and surface a concurrent edit as `409 PLAYLIST_CONFLICT`; add can also return it from the pre-image read, while `PATCH /playlists/:id` (metadata) carries no such check and never returns `409 PLAYLIST_CONFLICT`.

#### POST /api/v2/playlists

Create a new playlist, optionally seeded with up to 100 tracks.

**Scope:** `library`

**Parameters:**

- `name` (body, string, required) [min: 1, max: 200]: Playlist name (1-200 chars).
- `description` (body, string) [max: 1000]: Optional description (up to 1000 chars).
- `tracks` (body, object): Optional seed tracks: an array of track refs, each { id, type } where type is library-songs, library-music-videos, songs, or music-videos. Up to 100. Catalog refs (songs, music-videos) need allowLibraryImport.
- `parentId` (body, string): Create the playlist inside an existing folder.
- `allowLibraryImport` (body, boolean): Permit catalog seed tracks to import into your library.

**Request body:**

```json
{
	"name": "Late Night Coding",
	"description": "Focus music",
	"tracks": [{ "id": "i.abc123", "type": "library-songs" }],
	"allowLibraryImport": false
}
```

**Example response:**

```json
{ "data": { "id": "p.NewlyCreatedId" } }
```

**Errors:**

- `INVALID_REQUEST` (400): Malformed body / query / path params
- `INVALID_TRACK_REF` (400): A track ref was malformed or a move index was out of range
- `CATALOG_IMPORT_NOT_ALLOWED` (400): A catalog ref (songs / music-videos) was sent without allowLibraryImport: true
- `PLAYLIST_WRITE_RATE_LIMITED` (429): Too many playlist writes in the sliding window (see Retry-After)
- `RPC_TIMEOUT` (504): Frontend did not respond within 30 s
- `WRITE_FAILED` (502): The underlying Apple Music playlist write failed
- `RPC_INVALID_RESULT` (500): The renderer returned an unexpected result for a playlist operation

A brand-new playlist has no prior state, so create returns only `{ id }` (no `snapshotAt`).

#### PATCH /api/v2/playlists/:id

Update a playlist's name, description, or visibility. Send at least one field.

**Scope:** `library`

**Parameters:**

- `id` (path, string, required): Library playlist id.
- `name` (body, string) [min: 1, max: 200]: New name.
- `description` (body, string) [max: 1000]: New description.
- `isPublic` (body, boolean): Whether the playlist is public.

**Request body:**

```json
{ "name": "Late Night Coding v2", "isPublic": true }
```

**Example response:**

```json
{ "data": { "id": "p.xxx" } }
```

**Errors:**

- `INVALID_REQUEST` (400): Malformed body / query / path params
- `PLAYLIST_NOT_FOUND` (404): No editable playlist with that id
- `PLAYLIST_NOT_EDITABLE` (403): The playlist is not owned or editable by this account
- `PLAYLIST_IS_SMART` (409): Smart (rule-managed) playlists reject direct track or description edits
- `PLAYLIST_WRITE_RATE_LIMITED` (429): Too many playlist writes in the sliding window (see Retry-After)
- `RPC_TIMEOUT` (504): Frontend did not respond within 30 s
- `WRITE_FAILED` (502): The underlying Apple Music playlist write failed
- `RPC_INVALID_RESULT` (500): The renderer returned an unexpected result for a playlist operation

A metadata-only write captures no track pre-image, so its `playlistChanged` event carries `snapshotAt: null`. Editing a smart playlist's description returns `409 PLAYLIST_IS_SMART` (its description encodes the rules); renaming and visibility changes are allowed.

#### POST /api/v2/playlists/:id/tracks

Append tracks to the end of a playlist.

**Scope:** `library`

**Parameters:**

- `id` (path, string, required): Library playlist id.
- `tracks` (body, object, required): Array of 1-100 track refs, each { id, type } where type is library-songs, library-music-videos, songs, or music-videos.
- `allowLibraryImport` (body, boolean): Required if any ref is a catalog ref (songs, music-videos), which Apple imports into your library.

**Request body:**

```json
{
	"tracks": [
		{ "id": "i.def456", "type": "library-songs" },
		{ "id": "1440833098", "type": "songs" }
	],
	"allowLibraryImport": true
}
```

**Example response:**

```json
{ "data": { "added": 2, "trackCount": 44, "snapshotAt": "2026-07-09T18:20:05.123Z" } }
```

**Errors:**

- `INVALID_REQUEST` (400): Malformed body / query / path params
- `PLAYLIST_NOT_FOUND` (404): No editable playlist with that id
- `PLAYLIST_NOT_EDITABLE` (403): The playlist is not owned or editable by this account
- `PLAYLIST_IS_SMART` (409): Smart (rule-managed) playlists reject direct track or description edits
- `PLAYLIST_CONFLICT` (409): The playlist changed between read and write (optimistic lastModifiedDate check)
- `SNAPSHOT_FAILED` (503): The pre-write snapshot could not be recorded, so the write was refused and nothing changed
- `PLAYLIST_WRITE_RATE_LIMITED` (429): Too many playlist writes in the sliding window (see Retry-After)
- `RPC_TIMEOUT` (504): Frontend did not respond within 30 s
- `WRITE_FAILED` (502): The underlying Apple Music playlist write failed
- `RPC_INVALID_RESULT` (500): The renderer returned an unexpected result for a playlist operation
- `INVALID_TRACK_REF` (400): A track ref was malformed or a move index was out of range
- `CATALOG_IMPORT_NOT_ALLOWED` (400): A catalog ref (songs / music-videos) was sent without allowLibraryImport: true

#### DELETE /api/v2/playlists/:id/tracks

Remove tracks by their library id, by their 0-based position, or both.

**Scope:** `library`

**Parameters:**

- `id` (path, string, required): Library playlist id.
- `ids` (body, string[]): Track ids to remove (up to 500).
- `indices` (body, object): Zero-based positions to remove (up to 500). At least one of ids or indices must be non-empty.

**Request body:**

```json
{ "indices": [0, 5, 6] }
```

**Example response:**

```json
{ "data": { "removed": 3, "trackCount": 41, "snapshotAt": "2026-07-09T18:22:10.900Z" } }
```

**Errors:**

- `INVALID_REQUEST` (400): Malformed body / query / path params
- `PLAYLIST_NOT_FOUND` (404): No editable playlist with that id
- `PLAYLIST_NOT_EDITABLE` (403): The playlist is not owned or editable by this account
- `PLAYLIST_IS_SMART` (409): Smart (rule-managed) playlists reject direct track or description edits
- `PLAYLIST_CONFLICT` (409): The playlist changed between read and write (optimistic lastModifiedDate check)
- `SNAPSHOT_FAILED` (503): The pre-write snapshot could not be recorded, so the write was refused and nothing changed
- `PLAYLIST_WRITE_RATE_LIMITED` (429): Too many playlist writes in the sliding window (see Retry-After)
- `RPC_TIMEOUT` (504): Frontend did not respond within 30 s
- `WRITE_FAILED` (502): The underlying Apple Music playlist write failed
- `RPC_INVALID_RESULT` (500): The renderer returned an unexpected result for a playlist operation

If nothing matched, `removed` is `0`, the playlist is untouched, no new snapshot is taken, and `snapshotAt` is the most recent existing snapshot.

#### PUT /api/v2/playlists/:id/tracks

Replace the whole track list. Requires expectedTrackCount so a stale list cannot truncate the playlist.

**Scope:** `library`

**Parameters:**

- `id` (path, string, required): Library playlist id.
- `tracks` (body, object, required): The new full track list: an array of up to 500 track refs. May be empty ([]) for a deliberate clear-all.
- `expectedTrackCount` (body, integer, required) [min: 0]: The playlist's current track count. If it does not match the server, the write is refused with 409 TRACK_COUNT_MISMATCH.
- `allowLibraryImport` (body, boolean): Required if any ref is a catalog ref (songs, music-videos).

**Request body:**

```json
{
	"tracks": [{ "id": "i.def456", "type": "library-songs" }],
	"expectedTrackCount": 41,
	"allowLibraryImport": false
}
```

**Example response:**

```json
{ "data": { "trackCount": 1, "snapshotAt": "2026-07-09T18:23:44.010Z" } }
```

**Errors:**

- `INVALID_REQUEST` (400): Malformed body / query / path params
- `PLAYLIST_NOT_FOUND` (404): No editable playlist with that id
- `PLAYLIST_NOT_EDITABLE` (403): The playlist is not owned or editable by this account
- `PLAYLIST_IS_SMART` (409): Smart (rule-managed) playlists reject direct track or description edits
- `PLAYLIST_CONFLICT` (409): The playlist changed between read and write (optimistic lastModifiedDate check)
- `SNAPSHOT_FAILED` (503): The pre-write snapshot could not be recorded, so the write was refused and nothing changed
- `PLAYLIST_WRITE_RATE_LIMITED` (429): Too many playlist writes in the sliding window (see Retry-After)
- `RPC_TIMEOUT` (504): Frontend did not respond within 30 s
- `WRITE_FAILED` (502): The underlying Apple Music playlist write failed
- `RPC_INVALID_RESULT` (500): The renderer returned an unexpected result for a playlist operation
- `INVALID_TRACK_REF` (400): A track ref was malformed or a move index was out of range
- `CATALOG_IMPORT_NOT_ALLOWED` (400): A catalog ref (songs / music-videos) was sent without allowLibraryImport: true
- `TRACK_COUNT_MISMATCH` (409): PUT /tracks expectedTrackCount did not match the server's current count

#### POST /api/v2/playlists/:id/tracks/move

Move a single track from one position to another. Both indices are 0-based.

**Scope:** `library`

**Parameters:**

- `id` (path, string, required): Library playlist id.
- `from` (body, integer, required) [min: 0]: Current 0-based index of the track.
- `to` (body, integer, required) [min: 0]: Target 0-based index.

**Request body:**

```json
{ "from": 5, "to": 0 }
```

**Example response:**

```json
{ "data": { "trackCount": 41, "snapshotAt": "2026-07-09T18:24:12.400Z" } }
```

**Errors:**

- `INVALID_REQUEST` (400): Malformed body / query / path params
- `PLAYLIST_NOT_FOUND` (404): No editable playlist with that id
- `PLAYLIST_NOT_EDITABLE` (403): The playlist is not owned or editable by this account
- `PLAYLIST_IS_SMART` (409): Smart (rule-managed) playlists reject direct track or description edits
- `PLAYLIST_CONFLICT` (409): The playlist changed between read and write (optimistic lastModifiedDate check)
- `SNAPSHOT_FAILED` (503): The pre-write snapshot could not be recorded, so the write was refused and nothing changed
- `PLAYLIST_WRITE_RATE_LIMITED` (429): Too many playlist writes in the sliding window (see Retry-After)
- `RPC_TIMEOUT` (504): Frontend did not respond within 30 s
- `WRITE_FAILED` (502): The underlying Apple Music playlist write failed
- `RPC_INVALID_RESULT` (500): The renderer returned an unexpected result for a playlist operation
- `INVALID_TRACK_REF` (400): A track ref was malformed or a move index was out of range

An out-of-range index returns `400 INVALID_TRACK_REF`; a negative index is rejected earlier as `400 INVALID_REQUEST`.

#### GET /api/v2/playlists/:id/history

Read the Playlist Time Machine snapshots for a playlist. Not rate-limited.

**Scope:** `library`

**Parameters:**

- `id` (path, string, required): Library playlist id.

**Example response:**

```json
{
	"data": {
		"entries": [
			{
				"timestamp": "2026-07-09T18:20:05.123Z",
				"trackCount": 42,
				"tracks": [
					{
						"id": "i.abc123",
						"name": "Song Title",
						"artistName": "Artist",
						"albumName": "Album",
						"durationInMillis": 240000,
						"artwork": "https://…"
					}
				]
			}
		]
	}
}
```

**Errors:**

- `INVALID_REQUEST` (400): Malformed body / query / path params
- `WRITE_FAILED` (502): The underlying Apple Music playlist write failed
- `RPC_INVALID_RESULT` (500): The renderer returned an unexpected result for a playlist operation

Entries are ordered oldest-first (newest last); each is a full pre-image of the track list at that `timestamp`. A playlist with no recorded history returns `200` with an empty `entries` array.

#### POST /api/v2/playlists/:id/history/restore

Restore a playlist to a snapshot timestamp. The restore is itself undoable.

**Scope:** `library`

**Parameters:**

- `id` (path, string, required): Library playlist id.
- `timestamp` (body, string, required): The snapshot timestamp from a write response or GET /history.

**Request body:**

```json
{ "timestamp": "2026-07-09T18:20:05.123Z" }
```

**Example response:**

```json
{ "data": { "trackCount": 42, "snapshotAt": "2026-07-09T18:25:03.777Z" } }
```

**Errors:**

- `INVALID_REQUEST` (400): Malformed body / query / path params
- `PLAYLIST_NOT_FOUND` (404): No editable playlist with that id
- `PLAYLIST_NOT_EDITABLE` (403): The playlist is not owned or editable by this account
- `PLAYLIST_IS_SMART` (409): Smart (rule-managed) playlists reject direct track or description edits
- `PLAYLIST_CONFLICT` (409): The playlist changed between read and write (optimistic lastModifiedDate check)
- `SNAPSHOT_FAILED` (503): The pre-write snapshot could not be recorded, so the write was refused and nothing changed
- `PLAYLIST_WRITE_RATE_LIMITED` (429): Too many playlist writes in the sliding window (see Retry-After)
- `RPC_TIMEOUT` (504): Frontend did not respond within 30 s
- `WRITE_FAILED` (502): The underlying Apple Music playlist write failed
- `RPC_INVALID_RESULT` (500): The renderer returned an unexpected result for a playlist operation
- `HISTORY_ENTRY_NOT_FOUND` (404): No Playlist Time Machine snapshot with that timestamp

Restore snapshots the current (pre-restore) state first, so the returned `snapshotAt` lets you undo the restore. An unknown timestamp returns `404 HISTORY_ENTRY_NOT_FOUND`.

### Apple Music

Query Apple Music through Cider without ever handling raw credentials. Cider signs each request with the user's tokens and storefront and hands back Apple's response, so your app gets catalog, search, and library data without ever storing an Apple Music token of its own. Reads only. Prefer this over the raw credentials from `GET /client/tokens`.

#### GET /api/v2/amapi/search

Search the Apple Music catalog for songs, albums, artists, and playlists. Cider fills in the user's storefront, so you don't need to know it.

**Scope:** `library`

**Parameters:**

- `term` (query, string, required): What to search for.
- `types` (query, string) [default: songs,albums,artists,playlists]: Comma-separated result types: songs, albums, artists, playlists, music-videos, stations, curators, apple-curators.
- `limit` (query, integer) [default: 25, min: 1, max: 25]: Results per type. Apple caps this at 25.
- `offset` (query, integer) [default: 0, min: 0]: Where to start, for paging.
- `storefront` (query, string): Two-letter storefront code. Defaults to the user's own storefront.
- `l` (query, string): Language tag, e.g. en-US.

**Example response:**

```json
{
	"data": {
		"results": {
			"songs": {
				"data": [
					{ "id": "203709340", "type": "songs", "attributes": { "name": "Buddy Holly", "artistName": "Weezer" } }
				]
			}
		}
	}
}
```

**Errors:**

- `INVALID_REQUEST` (400): Missing term, or a bad type or limit.
- `AMAPI_ERROR` (502): Apple Music returned an error. The status mirrors Apple's, e.g. 401, 404, or 429.

The response is Apple Music's own search envelope, passed straight through under `data`.

#### GET /api/v2/amapi/catalog/:type/:id

Look up a single catalog resource by type and id, like a song, album, artist, or playlist.

**Scope:** `library`

**Parameters:**

- `type` (path, string, required): songs, albums, artists, playlists, music-videos, stations, curators, apple-curators, or record-labels.
- `id` (path, string, required): The catalog id.
- `include` (query, string): Comma-separated relationships to include, e.g. albums,artists.
- `views` (query, string): Comma-separated views to include.
- `l` (query, string): Language tag, e.g. en-US.

**Example response:**

```json
{
	"data": {
		"data": [{ "id": "203709340", "type": "songs", "attributes": { "name": "Buddy Holly", "artistName": "Weezer" } }]
	}
}
```

**Errors:**

- `INVALID_REQUEST` (400): Unknown type or malformed id.
- `AMAPI_ERROR` (502): Apple Music returned an error. The status mirrors Apple's.

Returns Apple Music's native lookup envelope under `data`.

#### GET /api/v2/amapi/raw/:path

Forward any Apple Music API read straight through. Append the Apple Music path after /amapi/raw/ and Cider signs and proxies it.

**Scope:** `library`

**Parameters:**

- `path` (path, string, required): The Apple Music API path, starting with v1/. Write $STOREFRONT and Cider substitutes the user's storefront. Only relative v1/ read paths are accepted.

**Example response:**

```json
{
	"data": {
		"results": { "songs": { "data": [] } }
	}
}
```

**Errors:**

- `INVALID_REQUEST` (400): The path was not a relative v1/ Apple Music path.
- `AMAPI_ERROR` (502): Apple Music returned an error. The status mirrors Apple's.

Only relative Apple Music API paths starting with `v1/` are accepted. Absolute URLs, other hosts, and path traversal are rejected. Reads only. Cider substitutes `$STOREFRONT` with the user's storefront, so you can use it literally.

### Lyrics

Read lyrics, provider/source info, community (UGC) variations, and translations.

**Cold-fetch latency:** lyric providers are tried sequentially, so a track that no provider has cached can take up to ~55 s before a structured 404/504 comes back. `/lyrics/current` is usually instant: it reads the warm cache the in-app lyric view already populated. Submitting your own community lyrics uses a separate endpoint, `POST /api/v1/lyrics/submit`, and isn't covered here.

#### GET /api/v2/lyrics/current

Get the lyrics for whatever is playing right now. Usually returns instantly because it reads the cache the in-app lyrics view already filled.

**Scope:** `lyrics`

**Parameters:**

- `words` (query, boolean) [default: false]: Include per-word timing arrays on each line (word-synced lyrics only)
- `ttml` (query, boolean) [default: false]: Include the raw TTML document in the response

**Example response:**

```json
{
	"data": {
		"id": "1613600188",
		"source": { "provider": "apple-music", "timingType": "Word", "language": "en" },
		"writers": ["Songwriter Name"],
		"lines": [{ "start": 12.3, "end": 15.1, "text": "First line of the song", "empty": false }]
	}
}
```

**Errors:**

- `NO_CURRENT_TRACK` (404): Nothing is playing
- `LYRICS_NOT_FOUND` (404): No provider returned lyrics for the track
- `LYRICS_TIMEOUT` (504): Lyric providers did not respond within the fetch budget

`source` = `{ provider, timingType: "Line"|"Word"|"None", language, contributorName? }`. `lines[]` = `{ start, end, text, empty, songPart?, isDuet?, isBackground?, words? }`. `words` arrays and raw `ttml` are opt-in via the query flags to keep payloads small. Boolean flags accept `true`/`false`/`1`/`0`.

#### GET /api/v2/lyrics/:id

Get the lyrics for any song by its id, not just the one playing. You can optionally lock the lookup to a single provider instead of letting Cider try them in order.

**Scope:** `lyrics`

**Parameters:**

- `id` (path, string, required): Catalog or library song id (library i. ids resolve to catalog)
- `provider` (query, enum) [enum: apple-music | musixmatch | netease | user]: Pin the lookup to one provider instead of the configured fallback order
- `words` (query, boolean) [default: false]: Include per-word timing arrays on each line (word-synced lyrics only)
- `ttml` (query, boolean) [default: false]: Include the raw TTML document in the response

**Errors:**

- `INVALID_REQUEST` (400): Malformed body / query / path params
- `LYRICS_NOT_FOUND` (404): No provider returned lyrics for the track
- `LYRICS_TIMEOUT` (504): Lyric providers did not respond within the fetch budget

`source` = `{ provider, timingType: "Line"|"Word"|"None", language, contributorName? }`. `lines[]` = `{ start, end, text, empty, songPart?, isDuet?, isBackground?, words? }`. `words` arrays and raw `ttml` are opt-in via the query flags to keep payloads small. Boolean flags accept `true`/`false`/`1`/`0`.

Cold fetches walk the providers sequentially and can take tens of seconds for obscure tracks, so budget for the 504.

#### GET /api/v2/lyrics/:id/variations

List the community-submitted lyric versions available for a song. Returns just the details of each one (contributor, language, and so on), not the lyrics themselves.

**Scope:** `lyrics`

**Parameters:**

- `id` (path, string, required): Catalog or library song id

**Example response:**

```json
{
	"data": {
		"trackId": "1613600188",
		"variations": [
			{
				"variationId": 412,
				"revisionId": 977,
				"contributorName": "Community Member",
				"forkedFrom": { "variationId": 398, "revisionId": 951, "contributorName": "Another Member" },
				"availableLayers": [{ "kind": "translation", "lang": "en", "coverage": 1 }],
				"language": "ja",
				"syncType": "syllable",
				"accessCount": 42,
				"trackName": "Song Title",
				"artistName": "Artist"
			}
		]
	}
}
```

**Errors:**

- `INVALID_REQUEST` (400): Malformed body / query / path params
- `LYRICS_NOT_FOUND` (404): No provider returned lyrics for the track

With community lyrics v2 on Rise, each variation also carries `revisionId` (the head revision it was served from), `forkedFrom` (`{ variationId, revisionId, contributorName? }`, present on remixes) and `availableLayers` (`[{ kind: "translation"|"pronunciation", lang, coverage }]`, coverage 0 to 1). Older servers omit all three, so treat them as optional and detect v2 by `revisionId`.

#### GET /api/v2/lyrics/:id/variations/:variationId

Get the full lyrics of one community-submitted version, in the same line-by-line shape as the regular lyrics endpoints.

**Scope:** `lyrics`

**Parameters:**

- `id` (path, string, required): Catalog or library song id
- `variationId` (path, string, required): Variation id from /variations
- `words` (query, boolean) [default: false]: Include per-word timing arrays on each line (word-synced lyrics only)
- `ttml` (query, boolean) [default: false]: Include the raw TTML document in the response

**Example response:**

```json
{
	"data": {
		"variationId": 412,
		"revisionId": 977,
		"source": { "provider": "User", "timingType": "Word", "language": "en", "contributorName": "Community Member" },
		"writers": [],
		"lines": [{ "start": 12.3, "end": 15.1, "text": "First line of the song", "empty": false }]
	}
}
```

**Errors:**

- `INVALID_REQUEST` (400): Malformed body / query / path params
- `LYRICS_VARIATION_NOT_FOUND` (404): Unknown community lyric variation id

With community lyrics v2 on Rise, each variation also carries `revisionId` (the head revision it was served from), `forkedFrom` (`{ variationId, revisionId, contributorName? }`, present on remixes) and `availableLayers` (`[{ kind: "translation"|"pronunciation", lang, coverage }]`, coverage 0 to 1). Older servers omit all three, so treat them as optional and detect v2 by `revisionId`.

#### GET /api/v2/lyrics/:id/translations

Get a line-by-line translation of a song's lyrics into the language you ask for.

**Scope:** `lyrics`

**Parameters:**

- `id` (path, string, required): Catalog or library song id
- `language` (query, string, required): ISO 639-1 language code (see /lyrics/languages)

**Example response:**

```json
{
	"data": {
		"language": "ja",
		"credit": "Generated translation",
		"translations": [{ "line": "First line of the song", "translation": "曲の最初の行" }]
	}
}
```

**Errors:**

- `INVALID_REQUEST` (400): Malformed body / query / path params
- `LYRICS_TRANSLATIONS_NOT_FOUND` (404): No translation for that language: it may still be generating, retry later

Single-shot: the endpoint checks the cache, then makes one translation-service call. A 404 can mean the translation is **still generating**, so retry after a short delay.

#### GET /api/v2/lyrics/languages

List the languages you can translate lyrics into, as label/value pairs ready to drop into a picker.

**Scope:** `lyrics`

**Example response:**

```json
{
	"data": {
		"languages": [{ "label": "Japanese", "value": "ja" }]
	}
}
```

### Plugins

Ask Cider to install plugins from a URL, with the user's approval. **Each install still needs explicit per-plugin user consent via a dialog**, even once your app has the scope: the scope is the gate for "this app can ask", and the dialog is the gate for "this specific plugin gets installed".

#### POST /api/v2/plugins/install

Ask Cider to install a plugin from a .zip URL. Cider downloads the file, checks that it's a real plugin, and then asks the user to confirm, showing them the plugin's actual details rather than whatever your app claims.

**Scope:** `plugins`

**Parameters:**

- `url` (body, string, required) [max: 2048]: http(s) URL to the .zip, ≤ 2048 chars

**Request body:**

```json
{ "url": "https://example.com/my-plugin.zip" }
```

**Example response:**

```json
{
	"data": {
		"identifier": "com.example.my-plugin",
		"name": "My Plugin",
		"version": "1.2.3",
		"installPath": "/.../plugins/com.example.my-plugin"
	}
}
```

**Errors:**

- `INVALID_REQUEST` (400): Body shape / URL bad
- `PLUGIN_INSTALL_DENIED` (403): User denied the install dialog
- `INSUFFICIENT_SCOPE` (403): Token does not carry the required scope
- `PLUGIN_INSTALL_TIMEOUT` (408): User did not respond within 3 min
- `PLUGIN_INSTALL_BUSY` (409): Another install dialog is already pending
- `PLUGIN_BAD_ZIP` (422): Downloaded file isn't a valid zip
- `PLUGIN_BAD_MANIFEST` (422): plugin.yml missing / malformed / missing identifier
- `PLUGIN_INSTALL_COOLDOWN` (429): Same IP fired another install request within 2 s
- `PLUGIN_DOWNLOAD_FAILED` (502): URL unreachable or returned non-200
- `PLUGIN_INSTALL_FAILED` (500): Extraction / filesystem error after consent

The dialog on the Cider device shows the plugin name, author, version, description, source host, and size. If a plugin with the same `identifier` is already installed, the dialog displays an **Upgrade** chip and the install replaces the existing folder on approve. Cider usually needs a reload to activate new plugins.

Rate limits: 2 s per-IP cooldown, one pending dialog globally, 3 min user-response timeout.

**Alternative:** `cider://install-plugin?url=<zip-url>`, an on-device protocol URL that opens the same dialog with no scope / token required.

### Config

Read a safe, read-only copy of Cider's settings so your app can mirror them. Secrets like tokens are stripped out first.

#### GET /api/v2/config

Read-only snapshot of Cider's configuration (the same data persisted to spa-config.yml): appearance, audio, lyrics, connectivity, behavior, and the rest.

**Scope:** `config`

**Parameters:**

- `path` (query, string): Dot-notation subtree selector, e.g. audio.crossfade or visual.appearance. Returns just that value instead of the full object.

**Example response:**

```json
{ "data": { "enabled": true, "durationSec": 5, … } }
```

**Errors:**

- `INVALID_REQUEST` (400): path is empty or not valid dot-notation
- `INSUFFICIENT_SCOPE` (403): Token does not carry the required scope
- `CONFIG_PATH_NOT_FOUND` (404): ?path= does not match any config key

**Redaction.** The snapshot is sanitized before it leaves Cider, even for legacy all-access tokens:

- `connectivity.apiTokens[*].token` values are replaced with `"<redacted>"`. Token metadata (name, scopes, creation time) is kept; the secrets are not, so a `config`-scoped token can never escalate by reading other tokens.
- `remote.tunnelUUID` is replaced with `"<redacted>"` when set.
- The `plugins` settings subtree is omitted entirely: plugin settings are schema-less third-party data that may contain secrets Cider cannot identify.

The config is **read-only** through this endpoint by design. Settings that are writable over the API have dedicated, validated endpoints (e.g. `PATCH /api/v2/audio/crossfade`) that also keep the running app in sync.

The config shape follows Cider's internal settings model and may gain or move keys between releases. Treat unknown keys as opaque and prefer `path` reads for the specific values you sync.

### Events

Cider also broadcasts realtime events over Socket.IO at the same host/port as the HTTP API. Events fan out on the `API:Playback` channel as `{ type, data }` messages.

Receiving broadcasts on `API:Playback` works for any connected socket; no scope check is applied to WebSocket messages today. (The private room requires `CLIENT_INFO.capi`, an internal token, not a user API token.)

```js
import { io } from "socket.io-client"

const socket = io("http://127.0.0.1:10767", { transports: ["websocket", "polling"] })
socket.on("API:Playback", ({ type, data }) => {
	if (type === "playerStatus.volumeDidChange") {
		console.log("volume is now", data)
	}
})
```

#### GET /api/v2/events/catalog

Get a machine-readable description of the whole API in one call: every realtime event, the scope each endpoint needs, the rate limits, and the path aliases. Handy for generating client code automatically.

**Scope:** none

Useful for generating clients or SDKs dynamically.
