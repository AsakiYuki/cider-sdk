import type { Artwork } from "./common.js"

export interface NowPlayingStatus {
	inLibrary: boolean
	/** `-1` dislike, `0` none, `1` love. */
	rating: -1 | 0 | 1
}
export interface PlaylistSummary {
	id: string
	name: string
	description?: string
	canEdit: boolean
	trackCount: number
	artwork?: Artwork
}
export interface LibraryAlbum {
	id: string
	name: string
	artistName: string
	trackCount: number
	releaseDate?: string
	artwork?: Artwork
}
export interface LibraryArtist {
	id: string
	name: string
	artwork?: Artwork
}
/** Library song rows. Note the duration field is `durationMs`, not the catalog's `durationInMillis`. */
export interface PlaylistTrack {
	id: string
	name: string
	artistName: string
	albumName: string
	durationMs: number
	trackNumber?: number
	artwork?: Artwork
	[key: string]: unknown
}
export type RecentlyAddedItem =
	| ({ type: "library-albums" } & LibraryAlbum)
	| ({ type: "library-playlists" } & PlaylistSummary)
export interface LibraryPage<T> {
	items: T[]
}
