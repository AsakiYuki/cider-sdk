import { BaseController } from "./base.controller.js"
import type {
	AudioQuality,
	EnabledStatus,
	NowPlayingTrack,
	PlaybackRate,
	PlaybackSnapshot,
	PlaybackStatus,
	PlaybackTime,
	RepeatStatus,
} from "../models/playback.js"
import type { MusicKitType, RepeatMode } from "../models/enums.js"

export class PlaybackController extends BaseController {
	get(signal?: AbortSignal) {
		return super.getApi<PlaybackSnapshot>("/api/v2/playback", undefined, signal)
	}
	nowPlaying(signal?: AbortSignal) {
		return super.getApi<NowPlayingTrack | null>("/api/v2/playback/now-playing", undefined, signal)
	}
	state(signal?: AbortSignal) {
		return super.getApi<PlaybackStatus>("/api/v2/playback/state", undefined, signal)
	}
	time(signal?: AbortSignal) {
		return super.getApi<PlaybackTime>("/api/v2/playback/time", undefined, signal)
	}
	audioQuality(signal?: AbortSignal) {
		return super.getApi<AudioQuality>("/api/v2/playback/audio-quality", undefined, signal)
	}
	play(signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/play", undefined, signal)
	}
	pause(signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/pause", undefined, signal)
	}
	stop(signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/stop", undefined, signal)
	}
	toggle(signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/toggle", undefined, signal)
	}
	next(signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/next", undefined, signal)
	}
	previous(force?: boolean, signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/previous", force === undefined ? undefined : { force }, signal)
	}
	seek(position: number, signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/seek", { position }, signal)
	}
	playItem(type: MusicKitType, id: string, signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/play-item", { type, id }, signal)
	}
	playId(type: MusicKitType, id: string, signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/play-id", { type, id }, signal)
	}
	playUrl(url: string, signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/play-url", { url }, signal)
	}
	playHref(href: string, signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/play-href", { href }, signal)
	}
	playCollection(type: "albums" | "playlists" | "stations", id: string, shuffle = false, signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/play-collection", { type, id, shuffle }, signal)
	}
	rate(signal?: AbortSignal) {
		return super.getApi<PlaybackRate>("/api/v2/playback/rate", undefined, signal)
	}
	setRate(rate: number, signal?: AbortSignal) {
		return this.patchApi("/api/v2/playback/rate", { rate }, signal)
	}
	repeat(signal?: AbortSignal) {
		return super.getApi<RepeatStatus>("/api/v2/playback/repeat", undefined, signal)
	}
	setRepeat(mode: RepeatMode, signal?: AbortSignal) {
		return this.putApi("/api/v2/playback/repeat", { mode }, signal)
	}
	toggleRepeat(signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/repeat/toggle", undefined, signal)
	}
	shuffle(signal?: AbortSignal) {
		return super.getApi<EnabledStatus>("/api/v2/playback/shuffle", undefined, signal)
	}
	setShuffle(enabled: boolean, signal?: AbortSignal) {
		return this.putApi("/api/v2/playback/shuffle", { enabled }, signal)
	}
	toggleShuffle(signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/shuffle/toggle", undefined, signal)
	}
	autoplay(signal?: AbortSignal) {
		return super.getApi<EnabledStatus>("/api/v2/playback/autoplay", undefined, signal)
	}
	setAutoplay(enabled: boolean, signal?: AbortSignal) {
		return this.putApi("/api/v2/playback/autoplay", { enabled }, signal)
	}
	toggleAutoplay(signal?: AbortSignal) {
		return this.postApi("/api/v2/playback/autoplay/toggle", undefined, signal)
	}
}
