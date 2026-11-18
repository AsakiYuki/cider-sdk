/** Compatibility barrel; import controllers from `src/controllers` in new code. */
export { PlaybackController, PlaybackController as PlaybackClient } from "../controllers/playback.controller.js"
export { QueueController, QueueController as QueueClient } from "../controllers/queue.controller.js"
export { AudioController, AudioController as AudioClient } from "../controllers/audio.controller.js"
export { LibraryController, LibraryController as LibraryClient } from "../controllers/library.controller.js"
export { PlaylistController, PlaylistController as PlaylistClient } from "../controllers/playlist.controller.js"
export {
	AppleMusicController,
	AppleMusicController as AppleMusicClient,
} from "../controllers/apple-music.controller.js"
export { LyricsController, LyricsController as LyricsClient } from "../controllers/lyrics.controller.js"
export { PluginController, PluginController as PluginClient } from "../controllers/plugin.controller.js"
