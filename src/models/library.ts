import type { Artwork, TrackSummary } from "./common.js"

export interface LibraryTrack extends TrackSummary {}
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
export interface PlaylistTrack extends TrackSummary {
	artistName: string
	albumName: string
	durationMs: number
	trackNumber?: number
}
export type RecentlyAddedItem =
	| ({ type: "library-albums" } & LibraryAlbum)
	| ({ type: "library-playlists" } & PlaylistSummary)
export interface LibraryPage<T> {
	items: T[]
}
export interface PaginatedResponse<T> {
	data: LibraryPage<T>
	meta: { offset: number; limit: number; total: number }
}
