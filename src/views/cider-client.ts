import { AppleMusicController as AppleMusicClient } from "../controllers/apple-music.controller.js"
import { AudioController as AudioClient } from "../controllers/audio.controller.js"
import { LibraryController as LibraryClient } from "../controllers/library.controller.js"
import { LyricsController as LyricsClient } from "../controllers/lyrics.controller.js"
import { PlaybackController as PlaybackClient } from "../controllers/playback.controller.js"
import { PlaylistController as PlaylistClient } from "../controllers/playlist.controller.js"
import { PluginController as PluginClient } from "../controllers/plugin.controller.js"
import { QueueController as QueueClient } from "../controllers/queue.controller.js"
import { EventsController } from "../controllers/events.controller.js"
import { AuthController } from "../controllers/auth.controller.js"
import { CiderHttpClient } from "../services/http-client.js"
import type { AccountTokens, AuthRequestBody, CiderOptions, ClientInfo, ConfigValue } from "../models/common.js"

/** Public SDK facade: exposes one service object for each Cider API area. */
export class Cider extends CiderHttpClient {
	readonly playback: PlaybackClient
	readonly queue: QueueClient
	readonly audio: AudioClient
	readonly library: LibraryClient
	readonly playlists: PlaylistClient
	readonly amapi: AppleMusicClient
	readonly lyrics: LyricsClient
	readonly plugins: PluginClient
	readonly events: EventsController
	readonly auth: AuthController

	constructor(options: CiderOptions = {}) {
		super(options)
		this.playback = new PlaybackClient(this)
		this.queue = new QueueClient(this)
		this.audio = new AudioClient(this)
		this.library = new LibraryClient(this)
		this.playlists = new PlaylistClient(this)
		this.amapi = new AppleMusicClient(this)
		this.lyrics = new LyricsClient(this)
		this.plugins = new PluginClient(this)
		this.events = new EventsController(this.baseUrl)
		this.auth = new AuthController(this)
	}

	requestToken(input: AuthRequestBody, signal?: AbortSignal) {
		return this.auth.requestToken(input, signal)
	}
	getClientInfo(signal?: AbortSignal) {
		return this.get<ClientInfo>("/api/v2/client/info", undefined, signal)
	}
	getAccountTokens(signal?: AbortSignal) {
		return this.get<AccountTokens>("/api/v2/client/tokens", undefined, signal)
	}
	getConfig(path?: string, signal?: AbortSignal) {
		return this.get<ConfigValue>("/api/v2/config", { path }, signal)
	}
	getEventsCatalog(signal?: AbortSignal) {
		return this.get<Record<string, unknown>>("/api/v2/events/catalog", undefined, signal)
	}
	installPlugin(url: string, signal?: AbortSignal) {
		return this.plugins.install(url, signal)
	}
}

export class CiderClient extends Cider {}

export function createCider(options?: CiderOptions): Cider {
	return new Cider(options)
}

export function createCiderClient(options?: CiderOptions): CiderClient {
	return new CiderClient(options)
}
