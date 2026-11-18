import type { AudioCaptureMode, ListeningMode } from "./enums.js"

export interface AudioVolume {
	volume: number
}
export interface AudioExclusions {
	albums: boolean
	playlists: boolean
	djMixes: boolean
	liveAlbums: boolean
}
export interface CrossfadeSettings {
	enabled?: boolean
	durationSec?: number
	skipEnabled?: boolean
	tempoSensitivity?: number
	loudnessSensitivity?: number
	exclusions?: Partial<AudioExclusions>
}
export interface CrossfadeState {
	enabled: boolean
	effectiveEnabled: boolean
	durationSec: number
	skipEnabled: boolean
	tempoSensitivity: number
	loudnessSensitivity: number
	exclusions: AudioExclusions
}
export interface AutomixSettings {
	enabled?: boolean
	energyBoost?: boolean
	normalizeDurationMs?: number
	exclusions?: Partial<AudioExclusions>
}
export interface AutomixState {
	enabled: boolean
	effectiveEnabled: boolean
	energyBoost: boolean
	normalizeDurationMs: number
	exclusions: AudioExclusions
}
export interface AtmosSettings {
	enabled?: boolean
	binaural?: boolean
	devicePreferences?: Record<string, string>
}
export interface AtmosState {
	enabled: boolean
	binaural: boolean
	devicePreferences: Record<string, string>
}
export interface CaptureSettings {
	mode?: AudioCaptureMode
	gainDb?: number
	autoEnable?: boolean
	autoApps?: string[]
	exclusive?: { sampleRate?: 0 | 48000 | 88200 | 96000 | 176400 | 192000; bitDepth?: 0 | 16 | 24 | 32 }
}
export interface CaptureState {
	supported: boolean
	mode: AudioCaptureMode
	gainDb: number
	autoEnable: boolean
	autoApps: string[]
	exclusive: { sampleRate: number; bitDepth: number }
}
export interface ListeningModeStatus {
	mode: ListeningMode
	available: boolean
}
