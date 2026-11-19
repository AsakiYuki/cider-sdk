import type { PlaylistTrackRefType } from "./enums.js"

export interface PlaylistWriteResult {
	trackCount: number
	snapshotAt: string
}
/** Create and metadata-only updates capture no track pre-image, so they return the id alone. */
export interface PlaylistCreateResult {
	id: string
}
export interface PlaylistTrackWriteResult extends PlaylistWriteResult {
	added?: number
	removed?: number
}
export interface PlaylistTrackRef {
	id: string
	type: PlaylistTrackRefType
}
export interface CreatePlaylistInput {
	name: string
	description?: string
	tracks?: PlaylistTrackRef[]
	parentId?: string
	allowLibraryImport?: boolean
}
export interface UpdatePlaylistInput {
	name?: string
	description?: string
	isPublic?: boolean
}
export interface AddPlaylistTracksInput {
	tracks: PlaylistTrackRef[]
	allowLibraryImport?: boolean
}
export interface DeletePlaylistTracksInput {
	ids?: string[]
	indices?: number[]
}
export interface SetPlaylistTracksInput {
	tracks: PlaylistTrackRef[]
	expectedTrackCount: number
	allowLibraryImport?: boolean
}
export interface MovePlaylistTrackInput {
	from: number
	to: number
}
export interface PlaylistHistoryEntry {
	timestamp: string
	trackCount: number
	tracks: Array<{
		id: string
		name: string
		artistName: string
		albumName: string
		durationInMillis: number
		artwork?: string
	}>
}
export interface PlaylistHistory {
	entries: PlaylistHistoryEntry[]
}
