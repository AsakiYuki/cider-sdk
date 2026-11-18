import type { PlaybackState, RepeatMode } from "./enums.js"
import type { Artwork } from "./common.js"

export interface PlaybackTime {
	currentTime: number
	duration: number
	remaining: number
}
export interface NowPlayingTrack {
	name: string
	artistName: string
	albumName: string
	artwork?: Artwork
	durationInMillis: number
	inFavorites: boolean
	inLibrary: boolean
	flavor?: string
}
export interface PlaybackSnapshot {
	state: PlaybackState
	nowPlaying: NowPlayingTrack | null
	time: PlaybackTime
	volume: number
	repeatMode: RepeatMode
	shuffleMode: boolean
	autoplay: boolean
	rate: number
}
export interface PlaybackStatus {
	state: PlaybackState
}
export interface PlaybackRate {
	rate: number
}
export interface RepeatStatus {
	mode: RepeatMode
}
export interface EnabledStatus {
	enabled: boolean
}
export interface AudioQuality {
	flavor: string
	flavorLabel: string
	deviceAudioConfig: { channelCount: number; sampleRate: number; supportsAtmos: boolean; supportedCodecs: string[] }
	localPlayback: Record<string, unknown> | null
}
