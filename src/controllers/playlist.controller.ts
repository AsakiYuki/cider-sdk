import { BaseController } from "./base.controller.js"
import type {
	AddPlaylistTracksInput,
	CreatePlaylistInput,
	DeletePlaylistTracksInput,
	MovePlaylistTrackInput,
	PlaylistCreateResult,
	PlaylistHistory,
	PlaylistTrackWriteResult,
	PlaylistWriteResult,
	SetPlaylistTracksInput,
	UpdatePlaylistInput,
} from "../models/playlists.js"

/**
 * Playlist writes are relayed to Cider's frontend, which the server gives 30s before answering
 * `RPC_TIMEOUT`. Allow a little more so the caller sees that actionable error instead of a
 * client-side abort.
 */
const WRITE_TIMEOUT = 35_000

export class PlaylistController extends BaseController {
	create(body: CreatePlaylistInput, signal?: AbortSignal) {
		return this.write<PlaylistCreateResult>("POST", "/api/v2/playlists", body, signal)
	}
	update(id: string, body: UpdatePlaylistInput, signal?: AbortSignal) {
		return this.write<PlaylistCreateResult>("PATCH", `/api/v2/playlists/${this.id(id)}`, body, signal)
	}
	addTracks(id: string, body: AddPlaylistTracksInput, signal?: AbortSignal) {
		return this.write<PlaylistTrackWriteResult>("POST", `/api/v2/playlists/${this.id(id)}/tracks`, body, signal)
	}
	deleteTracks(id: string, body: DeletePlaylistTracksInput, signal?: AbortSignal) {
		return this.write<PlaylistTrackWriteResult>("DELETE", `/api/v2/playlists/${this.id(id)}/tracks`, body, signal)
	}
	setTracks(id: string, body: SetPlaylistTracksInput, signal?: AbortSignal) {
		return this.write<PlaylistWriteResult>("PUT", `/api/v2/playlists/${this.id(id)}/tracks`, body, signal)
	}
	moveTrack(id: string, body: MovePlaylistTrackInput, signal?: AbortSignal) {
		return this.write<PlaylistWriteResult>("POST", `/api/v2/playlists/${this.id(id)}/tracks/move`, body, signal)
	}
	history(id: string, signal?: AbortSignal) {
		return this.getApi<PlaylistHistory>(`/api/v2/playlists/${this.id(id)}/history`, undefined, signal)
	}
	restore(id: string, timestamp: string, signal?: AbortSignal) {
		return this.write<PlaylistWriteResult>(
			"POST",
			`/api/v2/playlists/${this.id(id)}/history/restore`,
			{ timestamp },
			signal,
		)
	}

	private write<T>(method: string, path: string, body: object, signal?: AbortSignal) {
		return this.requestApi<T>(method, path, { body, signal, timeout: WRITE_TIMEOUT })
	}
}
