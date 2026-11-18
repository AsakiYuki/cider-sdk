/** Runtime enum-like values and their corresponding string union types. */
export const CiderScope = {
	Playback: "playback",
	Queue: "queue",
	Library: "library",
	Audio: "audio",
	Account: "account",
	Plugins: "plugins",
	Config: "config",
	Lyrics: "lyrics",
} as const
export type CiderScope = (typeof CiderScope)[keyof typeof CiderScope]

export const RepeatMode = { None: "none", One: "one", All: "all" } as const
export type RepeatMode = (typeof RepeatMode)[keyof typeof RepeatMode]

export const PlaybackState = { Playing: "playing", Paused: "paused", Stopped: "stopped" } as const
export type PlaybackState = (typeof PlaybackState)[keyof typeof PlaybackState]

export const ListeningMode = { Off: "off", Game: "game", AntiFatigue: "antifatigue" } as const
export type ListeningMode = (typeof ListeningMode)[keyof typeof ListeningMode]

export const AudioCaptureMode = { Off: "off", Capture: "capture", Exclusive: "exclusive" } as const
export type AudioCaptureMode = (typeof AudioCaptureMode)[keyof typeof AudioCaptureMode]

export const LyricsProvider = {
	AppleMusic: "apple-music",
	Musixmatch: "musixmatch",
	Netease: "netease",
	User: "user",
} as const
export type LyricsProvider = (typeof LyricsProvider)[keyof typeof LyricsProvider]

export const MusicKitType = {
	Songs: "songs",
	Albums: "albums",
	Artists: "artists",
	Playlists: "playlists",
	MusicVideos: "music-videos",
	Stations: "stations",
	Curators: "curators",
	AppleCurators: "apple-curators",
	RecordLabels: "record-labels",
} as const
export type MusicKitType = (typeof MusicKitType)[keyof typeof MusicKitType]

export const PlaylistTrackRefType = {
	LibrarySongs: "library-songs",
	LibraryMusicVideos: "library-music-videos",
	Songs: "songs",
	MusicVideos: "music-videos",
} as const
export type PlaylistTrackRefType = (typeof PlaylistTrackRefType)[keyof typeof PlaylistTrackRefType]
