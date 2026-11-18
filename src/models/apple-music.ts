import type { MusicKitType } from "./enums.js"

export interface AppleMusicResource {
	id: string
	type: MusicKitType
	href?: string
	attributes?: Record<string, unknown>
	relationships?: Record<string, unknown>
}
export interface AppleMusicSearchData {
	results: Partial<Record<MusicKitType, { data: AppleMusicResource[]; next?: string }>>
}
export interface AppleMusicLookupData {
	data: AppleMusicResource[]
}
export interface AppleMusicRawData {
	data?: unknown
	results?: unknown
	[key: string]: unknown
}
export interface AppleMusicSearchOptions {
	types?: string
	limit?: number
	offset?: number
	storefront?: string
	l?: string
}
