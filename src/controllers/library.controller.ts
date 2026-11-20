import { BaseController } from "./base.controller.js"
import type {
	LibraryAlbum,
	LibraryArtist,
	LibraryPage,
	NowPlayingStatus,
	PlaylistSummary,
	PlaylistTrack,
	RecentlyAddedItem,
} from "../models/library.js"
import type { Pagination } from "../models/common.js"

export class LibraryController extends BaseController {
	nowPlayingStatus(signal?: AbortSignal) {
		return this.getApi<NowPlayingStatus>("/api/v2/library/now-playing/status", undefined, signal)
	}
	addNowPlaying(signal?: AbortSignal) {
		return this.postApi("/api/v2/library/now-playing/add", undefined, signal)
	}
	removeNowPlaying(signal?: AbortSignal) {
		return this.deleteApi("/api/v2/library/now-playing", undefined, signal)
	}
	loveNowPlaying(signal?: AbortSignal) {
		return this.postApi("/api/v2/library/now-playing/love", undefined, signal)
	}
	dislikeNowPlaying(signal?: AbortSignal) {
		return this.postApi("/api/v2/library/now-playing/dislike", undefined, signal)
	}
	clearNowPlayingRating(signal?: AbortSignal) {
		return this.deleteApi("/api/v2/library/now-playing/rating", undefined, signal)
	}
	rateNowPlaying(rating: -1 | 0 | 1, signal?: AbortSignal) {
		return this.putApi("/api/v2/library/now-playing/rating", { rating }, signal)
	}
	playlists(pagination: Pagination = {}, signal?: AbortSignal) {
		return this.getApi<LibraryPage<PlaylistSummary>>("/api/v2/library/playlists", pagination, signal)
	}
	playlistSongs(id: string, pagination: Pagination = {}, signal?: AbortSignal) {
		return this.getApi<LibraryPage<PlaylistTrack>>(`/api/v2/library/playlists/${this.id(id)}/songs`, pagination, signal)
	}
	albums(pagination: Pagination = {}, signal?: AbortSignal) {
		return this.getApi<LibraryPage<LibraryAlbum>>("/api/v2/library/albums", pagination, signal)
	}
	albumSongs(id: string, pagination: Pagination = {}, signal?: AbortSignal) {
		return this.getApi<LibraryPage<PlaylistTrack>>(`/api/v2/library/albums/${this.id(id)}/songs`, pagination, signal)
	}
	artists(pagination: Pagination = {}, signal?: AbortSignal) {
		return this.getApi<LibraryPage<LibraryArtist>>("/api/v2/library/artists", pagination, signal)
	}
	artistAlbums(id: string, pagination: Pagination = {}, signal?: AbortSignal) {
		return this.getApi<LibraryPage<LibraryAlbum>>(`/api/v2/library/artists/${this.id(id)}/albums`, pagination, signal)
	}
	songs(pagination: Pagination = {}, signal?: AbortSignal) {
		return this.getApi<LibraryPage<PlaylistTrack>>("/api/v2/library/songs", pagination, signal)
	}
	recentlyAdded(pagination: Pagination = {}, signal?: AbortSignal) {
		return this.getApi<LibraryPage<RecentlyAddedItem>>("/api/v2/library/recently-added", pagination, signal)
	}
}
