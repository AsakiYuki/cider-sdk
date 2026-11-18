import { BaseController } from "./base.controller.js"
import type { AddPlaylistTracksInput, CreatePlaylistInput, DeletePlaylistTracksInput, PlaylistHistory, PlaylistTrackWriteResult, PlaylistWriteResult, MovePlaylistTrackInput, SetPlaylistTracksInput, UpdatePlaylistInput } from "../models/playlists.js"

export class PlaylistController extends BaseController {
	create(body: CreatePlaylistInput, signal?: AbortSignal) {
		return this.postApi<{ id: string }>("/api/v2/playlists", body, signal)
	}
	update(id: string, body: UpdatePlaylistInput, signal?: AbortSignal) {
		return this.patchApi<{ id: string }>(`/api/v2/playlists/${this.id(id)}`, body, signal)
	}
	addTracks(id: string, body: AddPlaylistTracksInput, signal?: AbortSignal) {
		return this.postApi<PlaylistTrackWriteResult>(`/api/v2/playlists/${this.id(id)}/tracks`, body, signal)
	}
	deleteTracks(id: string, body: DeletePlaylistTracksInput, signal?: AbortSignal) {
		return this.deleteApi<PlaylistTrackWriteResult>(`/api/v2/playlists/${this.id(id)}/tracks`, body, signal)
	}
	setTracks(id: string, body: SetPlaylistTracksInput, signal?: AbortSignal) {
		return this.putApi<PlaylistWriteResult>(`/api/v2/playlists/${this.id(id)}/tracks`, body, signal)
	}
	moveTrack(id: string, body: MovePlaylistTrackInput, signal?: AbortSignal) {
		return this.postApi<PlaylistWriteResult>(`/api/v2/playlists/${this.id(id)}/tracks/move`, body, signal)
	}
	history(id: string, signal?: AbortSignal) {
		return this.getApi<PlaylistHistory>(`/api/v2/playlists/${this.id(id)}/history`, undefined, signal)
	}
	restore(id: string, timestamp: string, signal?: AbortSignal) {
		return this.postApi<PlaylistWriteResult>(`/api/v2/playlists/${this.id(id)}/history/restore`, { timestamp }, signal)
	}
}
