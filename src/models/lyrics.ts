import type { LyricsProvider } from "./enums.js"

export interface LyricsLanguage {
	label: string
	value: string
}
export interface LyricsLanguages {
	languages: LyricsLanguage[]
}
export interface LyricsTranslation {
	language: string
	credit: string
	translations: Array<{ line: string; translation: string }>
}
export interface CommunityLyricLayer {
	kind: "translation" | "pronunciation"
	lang: string
	coverage: number
}
export interface CommunityLyricVariation {
	variationId: number
	revisionId?: number
	contributorName: string
	forkedFrom?: { variationId: number; revisionId: number; contributorName?: string }
	availableLayers?: CommunityLyricLayer[]
	language: string
	syncType: string
	accessCount: number
	trackName: string
	artistName: string
}
export interface CommunityLyricVariations {
	trackId: string
	variations: CommunityLyricVariation[]
}
export interface LyricsLine {
	start: number
	end: number
	text: string
	empty: boolean
	songPart?: string
	isDuet?: boolean
	isBackground?: boolean
	words?: Array<{ start: number; end: number; text: string }>
}
export interface Lyrics {
	id?: string
	variationId?: number
	revisionId?: number
	source: {
		provider: LyricsProvider | string
		timingType: "Line" | "Word" | "None"
		language: string
		contributorName?: string
	}
	writers?: string[]
	lines: LyricsLine[]
	ttml?: string
	[key: string]: unknown
}
