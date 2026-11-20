import assert from "node:assert/strict"
import {
	Cider,
	CiderApiError,
	CiderHttpClient,
	CiderScope,
	CiderTimeoutError,
	EventsController,
	createAuthLink,
	createPluginInstallLink,
	requestAuthToken,
	type CiderPlaybackEvent,
	type CiderSocketLike,
} from "../src/index.js"

type Call = { url: URL; init: RequestInit; self: unknown }

/** Records every call and answers with a canned JSON body. */
function stubFetch(
	responder: (call: Call) => { status?: number; body?: unknown; headers?: Record<string, string> } = () => ({}),
) {
	const calls: Call[] = []
	const fetcher = function (this: unknown, input: string | URL | Request, init: RequestInit = {}) {
		const call: Call = { url: new URL(String(input)), init, self: this }
		calls.push(call)
		const { status = 200, body = { data: null }, headers = {} } = responder(call)
		return Promise.resolve(
			new Response(status === 204 ? null : JSON.stringify(body), {
				status,
				headers: { "content-type": "application/json", ...headers },
			}),
		)
	} as unknown as typeof fetch
	return { fetcher, calls }
}

const tests: Array<[string, () => void | Promise<void>]> = []
const test = (name: string, fn: () => void | Promise<void>) => tests.push([name, fn])

// ---------------------------------------------------------------- transport

test("strips trailing slashes from baseUrl and builds the request URL", async () => {
	const { fetcher, calls } = stubFetch()
	const client = new CiderHttpClient({ baseUrl: "http://localhost:9999///", fetch: fetcher })
	await client.get("/api/v2/playback")
	assert.equal(calls[0]!.url.href, "http://localhost:9999/api/v2/playback")
})

test("serializes query params and drops undefined and null", async () => {
	const { fetcher, calls } = stubFetch()
	const client = new CiderHttpClient({ fetch: fetcher })
	await client.get("/api/v2/queue", { limit: 20, offset: 0, shuffle: false, gone: undefined, nope: null })
	const params = calls[0]!.url.searchParams
	assert.equal(params.get("limit"), "20")
	assert.equal(params.get("offset"), "0")
	assert.equal(params.get("shuffle"), "false")
	assert.equal(params.has("gone"), false)
	assert.equal(params.has("nope"), false)
})

test("sends the apptoken header, and omits it when auth is disabled", async () => {
	const { fetcher, calls } = stubFetch()
	const client = new CiderHttpClient({ fetch: fetcher, token: "tok_123" })
	await client.get("/api/v2/playback")
	await client.request("POST", "/api/v2/auth/request", { auth: false })
	assert.equal(new Headers(calls[0]!.init.headers).get("apptoken"), "tok_123")
	assert.equal(new Headers(calls[1]!.init.headers).get("apptoken"), null)
})

test("sets content-type only when a body is present", async () => {
	const { fetcher, calls } = stubFetch()
	const client = new CiderHttpClient({ fetch: fetcher })
	await client.post("/api/v2/playback/play")
	await client.post("/api/v2/playback/seek", { position: 45.5 })
	assert.equal(new Headers(calls[0]!.init.headers).get("content-type"), null)
	assert.equal(calls[0]!.init.body, undefined)
	assert.equal(new Headers(calls[1]!.init.headers).get("content-type"), "application/json")
	assert.equal(calls[1]!.init.body, '{"position":45.5}')
})

test("setToken and getToken round-trip", async () => {
	const { fetcher, calls } = stubFetch()
	const client = new CiderHttpClient({ fetch: fetcher })
	assert.equal(client.getToken(), undefined)
	client.setToken("later")
	assert.equal(client.getToken(), "later")
	await client.get("/api/v2/client/info")
	assert.equal(new Headers(calls[0]!.init.headers).get("apptoken"), "later")
})

test("treats 204 as an empty payload", async () => {
	const { fetcher } = stubFetch(() => ({ status: 204 }))
	const client = new CiderHttpClient({ fetch: fetcher })
	assert.deepEqual(await client.delete("/api/v2/queue"), {})
})

test("returns the response envelope unwrapped of nothing", async () => {
	const { fetcher } = stubFetch(() => ({ body: { data: { items: [] }, meta: { offset: 0, limit: 50, total: 0 } } }))
	const client = new CiderHttpClient({ fetch: fetcher })
	const response = await client.get<{ items: unknown[] }>("/api/v2/library/playlists")
	assert.deepEqual(response.data.items, [])
	assert.equal(response.meta?.total, 0)
})

// ---------------------------------------------------------------- errors

test("maps an error envelope onto CiderApiError", async () => {
	const { fetcher } = stubFetch(() => ({
		status: 403,
		body: { error: { code: "INSUFFICIENT_SCOPE", message: "Token does not carry the required scope" } },
	}))
	const client = new CiderHttpClient({ fetch: fetcher })
	const error = await client.get("/api/v2/library/songs").catch((e: unknown) => e)
	assert.ok(error instanceof CiderApiError)
	assert.equal(error.status, 403)
	assert.equal(error.code, "INSUFFICIENT_SCOPE")
	assert.equal(error.message, "Token does not carry the required scope")
	assert.equal(error.name, "CiderApiError")
})

test("exposes Retry-After on rate-limit errors", async () => {
	const { fetcher } = stubFetch(() => ({
		status: 429,
		body: { error: { code: "AUTH_REQUEST_COOLDOWN", message: "slow down" } },
		headers: { "retry-after": "5" },
	}))
	const client = new CiderHttpClient({ fetch: fetcher })
	const error = await client.post("/api/v2/auth/request").catch((e: unknown) => e)
	assert.ok(error instanceof CiderApiError)
	assert.equal(error.retryAfter, "5")
})

test("falls back to HTTP_ERROR when the error body is not a Cider envelope", async () => {
	const fetcher = (() => Promise.resolve(new Response("<html>nope</html>", { status: 502 }))) as unknown as typeof fetch
	const client = new CiderHttpClient({ fetch: fetcher })
	const error = await client.get("/api/v2/playback").catch((e: unknown) => e)
	assert.ok(error instanceof CiderApiError)
	assert.equal(error.code, "HTTP_ERROR")
	assert.equal(error.status, 502)
	assert.ok(error.message.length > 0)
})

test("a timeout rejects with CiderTimeoutError, not a bare Error", async () => {
	const fetcher = ((_url: string, init: RequestInit) =>
		new Promise((_resolve, reject) => {
			init.signal?.addEventListener("abort", () => reject((init.signal as AbortSignal).reason))
		})) as unknown as typeof fetch
	const client = new CiderHttpClient({ fetch: fetcher, timeout: 20 })
	const error = await client.get("/api/v2/playback").catch((e: unknown) => e)
	assert.ok(error instanceof CiderTimeoutError)
	assert.equal(error.timeout, 20)
})

test("a caller abort propagates its own reason and is not reported as a timeout", async () => {
	const fetcher = ((_url: string, init: RequestInit) =>
		new Promise((_resolve, reject) => {
			init.signal?.addEventListener("abort", () => reject((init.signal as AbortSignal).reason))
		})) as unknown as typeof fetch
	const client = new CiderHttpClient({ fetch: fetcher, timeout: 10_000 })
	const controller = new AbortController()
	const reason = new Error("caller changed their mind")
	const pending = client.get("/api/v2/playback", undefined, controller.signal).catch((e: unknown) => e)
	controller.abort(reason)
	const error = await pending
	assert.equal(error, reason)
	assert.equal(error instanceof CiderTimeoutError, false)
})

test("an already-aborted signal rejects without issuing the request", async () => {
	const { fetcher, calls } = stubFetch()
	const client = new CiderHttpClient({ fetch: fetcher })
	const reason = new Error("pre-aborted")
	const error = await client.get("/api/v2/playback", undefined, AbortSignal.abort(reason)).catch((e: unknown) => e)
	assert.equal(error, reason)
	assert.equal(calls.length, 0)
})

test("rejects construction when no fetch implementation exists", () => {
	const original = globalThis.fetch
	try {
		// @ts-expect-error simulating a runtime without fetch
		delete globalThis.fetch
		assert.throws(() => new CiderHttpClient(), TypeError)
	} finally {
		globalThis.fetch = original
	}
})

test("calls the global fetch unbound from the client (browsers reject method-style calls)", async () => {
	const original = globalThis.fetch
	try {
		let observed: unknown = "unset"
		globalThis.fetch = function (this: unknown) {
			observed = this
			return Promise.resolve(
				new Response(JSON.stringify({ data: null }), { headers: { "content-type": "application/json" } }),
			)
		} as unknown as typeof fetch
		const client = new CiderHttpClient()
		await client.get("/api/v2/client/info")
		assert.notEqual(observed, client)
	} finally {
		globalThis.fetch = original
	}
})

// ---------------------------------------------------------------- auth

test("createAuthLink encodes the deep link", () => {
	const url = createAuthLink({
		appName: "My Cider App",
		scopes: [CiderScope.Playback, CiderScope.Library],
		appImage: "https://example.com/icon.png",
	})
	const parsed = new URL(url)
	assert.equal(parsed.protocol, "cider:")
	assert.equal(parsed.searchParams.get("app-name"), "My Cider App")
	assert.equal(parsed.searchParams.get("scopes"), "playback,library")
	assert.equal(parsed.searchParams.get("app-image"), "https://example.com/icon.png")
})

test("createAuthLink omits app-image when not supplied", () => {
	const url = createAuthLink({ appName: "App", scopes: [CiderScope.Playback] })
	assert.equal(new URL(url).searchParams.has("app-image"), false)
})

test("createAuthLink rejects an out-of-range name or empty scopes", () => {
	assert.throws(() => createAuthLink({ appName: "  ", scopes: [CiderScope.Playback] }), RangeError)
	assert.throws(() => createAuthLink({ appName: "x".repeat(65), scopes: [CiderScope.Playback] }), RangeError)
	assert.throws(() => createAuthLink({ appName: "App", scopes: [] }), RangeError)
})

test("requestAuthToken validates before spending a round trip", async () => {
	const { fetcher, calls } = stubFetch()
	await assert.rejects(() => requestAuthToken({ app_name: "", scopes: [CiderScope.Playback] }, { fetch: fetcher }), RangeError)
	await assert.rejects(() => requestAuthToken({ app_name: "App", scopes: [] }, { fetch: fetcher }), RangeError)
	assert.equal(calls.length, 0)
})

test("requestAuthToken posts the consent body and returns the granted token", async () => {
	const { fetcher, calls } = stubFetch(() => ({ body: { data: { token: "tok_abc", scopes: ["playback"] } } }))
	const result = await requestAuthToken(
		{ app_name: "My App", scopes: [CiderScope.Playback, CiderScope.Library] },
		{ fetch: fetcher },
	)
	assert.equal(calls[0]!.url.pathname, "/api/v2/auth/request")
	assert.equal(calls[0]!.init.method, "POST")
	assert.deepEqual(result, { token: "tok_abc", scopes: ["playback"] })
})

test("auth.requestToken adopts the granted token on the client", async () => {
	const { fetcher } = stubFetch(() => ({ body: { data: { token: "tok_xyz", scopes: ["playback"] } } }))
	const cider = new Cider({ fetch: fetcher })
	assert.equal(cider.getToken(), undefined)
	await cider.requestToken({ app_name: "My App", scopes: [CiderScope.Playback] })
	assert.equal(cider.getToken(), "tok_xyz")
})

// ---------------------------------------------------------------- controllers

test("playback controller maps methods onto the documented verbs and paths", async () => {
	const { fetcher, calls } = stubFetch()
	const cider = new Cider({ fetch: fetcher, token: "t" })
	await cider.playback.pause()
	await cider.playback.seek(45.5)
	await cider.playback.setRepeat("all")
	await cider.playback.setShuffle(true)
	await cider.playback.setRate(1.25)
	await cider.playback.previous()
	await cider.playback.previous(true)
	await cider.playback.playCollection("albums", "123")

	const seen = calls.map((c) => `${c.init.method} ${c.url.pathname} ${c.init.body ?? ""}`.trim())
	assert.deepEqual(seen, [
		"POST /api/v2/playback/pause",
		'POST /api/v2/playback/seek {"position":45.5}',
		'PUT /api/v2/playback/repeat {"mode":"all"}',
		'PUT /api/v2/playback/shuffle {"enabled":true}',
		'PATCH /api/v2/playback/rate {"rate":1.25}',
		"POST /api/v2/playback/previous",
		'POST /api/v2/playback/previous {"force":true}',
		'POST /api/v2/playback/play-collection {"type":"albums","id":"123","shuffle":false}',
	])
})

test("queue remove targets the indexed item path", async () => {
	const { fetcher, calls } = stubFetch()
	const cider = new Cider({ fetch: fetcher, token: "t" })
	await cider.queue.remove(3)
	await cider.queue.move(5, 0)
	assert.equal(calls[0]!.init.method, "DELETE")
	assert.equal(calls[0]!.url.pathname, "/api/v2/queue/items/3")
	assert.equal(calls[1]!.init.body, '{"from":5,"to":0}')
})

test("library path ids are percent-encoded", async () => {
	const { fetcher, calls } = stubFetch()
	const cider = new Cider({ fetch: fetcher, token: "t" })
	await cider.library.playlistSongs("p.a/b c", { limit: 10 })
	assert.equal(calls[0]!.url.pathname, "/api/v2/library/playlists/p.a%2Fb%20c/songs")
	assert.equal(calls[0]!.url.searchParams.get("limit"), "10")
})

test("amapi search sends term, and raw encodes each path segment", async () => {
	const { fetcher, calls } = stubFetch()
	const cider = new Cider({ fetch: fetcher, token: "t" })
	await cider.amapi.search("weezer", { limit: 5 })
	await cider.amapi.catalog("songs", "203709340")
	await cider.amapi.raw("/catalog/us/songs/203 709")
	assert.equal(calls[0]!.url.searchParams.get("term"), "weezer")
	assert.equal(calls[0]!.url.searchParams.get("limit"), "5")
	assert.equal(calls[1]!.url.pathname, "/api/v2/amapi/catalog/songs/203709340")
	assert.equal(calls[2]!.url.pathname, "/api/v2/amapi/raw/catalog/us/songs/203%20709")
})

test("playlist writes hit the documented paths", async () => {
	const { fetcher, calls } = stubFetch()
	const cider = new Cider({ fetch: fetcher, token: "t" })
	await cider.playlists.create({ name: "Late Night Coding" })
	await cider.playlists.setTracks("p.1", { tracks: [], expectedTrackCount: 41 })
	await cider.playlists.moveTrack("p.1", { from: 5, to: 0 })
	await cider.playlists.restore("p.1", "2026-07-09T18:23:44.010Z")
	const seen = calls.map((c) => `${c.init.method} ${c.url.pathname}`)
	assert.deepEqual(seen, [
		"POST /api/v2/playlists",
		"PUT /api/v2/playlists/p.1/tracks",
		"POST /api/v2/playlists/p.1/tracks/move",
		"POST /api/v2/playlists/p.1/history/restore",
	])
})

test("audio controller PATCHes partial settings through untouched", async () => {
	const { fetcher, calls } = stubFetch()
	const cider = new Cider({ fetch: fetcher, token: "t" })
	await cider.audio.setVolume(0.5)
	await cider.audio.setCrossfade({ enabled: true, durationSec: 5 })
	assert.equal(calls[0]!.init.body, '{"volume":0.5}')
	assert.equal(calls[1]!.init.method, "PATCH")
	assert.equal(calls[1]!.init.body, '{"enabled":true,"durationSec":5}')
})

test("config read forwards the dot-notation path", async () => {
	const { fetcher, calls } = stubFetch()
	const cider = new Cider({ fetch: fetcher, token: "t" })
	await cider.getConfig("audio.crossfade")
	await cider.getConfig()
	assert.equal(calls[0]!.url.searchParams.get("path"), "audio.crossfade")
	assert.equal(calls[1]!.url.searchParams.has("path"), false)
})

test("createPluginInstallLink builds the on-device deep link", () => {
	const url = new URL(createPluginInstallLink("https://example.com/my plugin.zip"))
	assert.equal(url.protocol, "cider:")
	assert.equal(url.searchParams.get("url"), "https://example.com/my plugin.zip")
})

// ---------------------------------------------------------------- events

test("onPlayback refuses to subscribe before connect", () => {
	const events = new EventsController("http://127.0.0.1:10767")
	assert.throws(() => events.onPlayback(() => {}), /connect/)
})

test("connect subscribes, hands back an unsubscribe, and disconnects", () => {
	const handlers = new Set<(payload: CiderPlaybackEvent) => void>()
	let disconnected = 0
	let seenUrl = ""
	const socket: CiderSocketLike = {
		on(_event, listener) {
			handlers.add(listener)
			return this
		},
		off(_event, listener) {
			handlers.delete(listener)
			return this
		},
		disconnect() {
			disconnected += 1
		},
	}

	const events = new EventsController("http://127.0.0.1:10767")
	events.connect((url) => {
		seenUrl = url
		return socket
	})
	assert.equal(seenUrl, "http://127.0.0.1:10767")

	const received: CiderPlaybackEvent[] = []
	const unsubscribe = events.onPlayback((event) => received.push(event))
	assert.equal(handlers.size, 1)
	for (const handler of handlers) handler({ type: "playerStatus.volumeDidChange", data: 0.5 })
	assert.deepEqual(received, [{ type: "playerStatus.volumeDidChange", data: 0.5 }])

	unsubscribe()
	assert.equal(handlers.size, 0)
	events.disconnect()
	assert.equal(disconnected, 1)
})

test("reconnecting tears down the previous socket", () => {
	let disconnected = 0
	const socket: CiderSocketLike = {
		on() {
			return this
		},
		off() {
			return this
		},
		disconnect() {
			disconnected += 1
		},
	}
	const events = new EventsController("http://127.0.0.1:10767")
	events.connect(() => socket)
	events.connect(() => socket)
	assert.equal(disconnected, 1)
})

// ---------------------------------------------------------------- facade

test("the facade exposes every API area", () => {
	const cider = new Cider({ fetch: stubFetch().fetcher })
	for (const area of [
		"playback",
		"queue",
		"audio",
		"library",
		"playlists",
		"amapi",
		"lyrics",
		"plugins",
		"events",
		"auth",
	] as const) {
		assert.ok(cider[area], `missing ${area}`)
	}
})

// ---------------------------------------------------------------- runner

let failed = 0
for (const [name, fn] of tests) {
	try {
		await fn()
		console.log(`  ok  ${name}`)
	} catch (error) {
		failed += 1
		console.error(`FAIL  ${name}`)
		console.error(error instanceof Error ? `      ${error.message}` : error)
	}
}
console.log(`\n${tests.length - failed}/${tests.length} passed`)
if (failed > 0) process.exit(1)
