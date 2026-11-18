import { BaseController } from "./base.controller.js"
import type { AppleMusicLookupData, AppleMusicRawData, AppleMusicSearchData, AppleMusicSearchOptions } from "../models/apple-music.js"
import type { MusicKitType } from "../models/enums.js"
import type { Query } from "../models/common.js"

export class AppleMusicController extends BaseController {
	search(term: string, query: AppleMusicSearchOptions = {}, signal?: AbortSignal) {
		return this.getApi<AppleMusicSearchData>("/api/v2/amapi/search", { ...query, term }, signal)
	}
	catalog(type: MusicKitType, id: string, query: Query = {}, signal?: AbortSignal) {
		return this.getApi<AppleMusicLookupData>(`/api/v2/amapi/catalog/${this.id(type)}/${this.id(id)}`, query, signal)
	}
	raw(path: string, query?: Query, signal?: AbortSignal) {
		return this.getApi<AppleMusicRawData>(
			`/api/v2/amapi/raw/${path.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/")}`,
			query,
			signal,
		)
	}
}
