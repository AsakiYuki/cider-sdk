import { BaseController } from "./base.controller.js"
import type { CommunityLyricVariations, Lyrics, LyricsLanguages, LyricsTranslation } from "../models/lyrics.js"
import type { LyricsProvider } from "../models/enums.js"

export class LyricsController extends BaseController {
	current(query: { words?: boolean; ttml?: boolean } = {}, signal?: AbortSignal) {
		return this.requestApi<Lyrics>("GET", "/api/v2/lyrics/current", { query, signal, timeout: 60_000 })
	}
	get(id: string, query: { provider?: LyricsProvider; words?: boolean; ttml?: boolean } = {}, signal?: AbortSignal) {
		return this.requestApi<Lyrics>("GET", `/api/v2/lyrics/${this.id(id)}`, { query, signal, timeout: 60_000 })
	}
	variations(id: string, signal?: AbortSignal) {
		return this.getApi<CommunityLyricVariations>(`/api/v2/lyrics/${this.id(id)}/variations`, undefined, signal)
	}
	variation(id: string, variationId: number, query: { words?: boolean; ttml?: boolean } = {}, signal?: AbortSignal) {
		return this.getApi<Lyrics>(`/api/v2/lyrics/${this.id(id)}/variations/${variationId}`, query, signal)
	}
	translations(id: string, language: string, signal?: AbortSignal) {
		return this.getApi<LyricsTranslation>(`/api/v2/lyrics/${this.id(id)}/translations`, { language }, signal)
	}
	languages(signal?: AbortSignal) {
		return this.getApi<LyricsLanguages>("/api/v2/lyrics/languages", undefined, signal)
	}
}
