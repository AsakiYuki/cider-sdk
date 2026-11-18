import { BaseController } from "./base.controller.js"
import type { AtmosSettings, AtmosState, AutomixSettings, AutomixState, AudioVolume, CaptureSettings, CaptureState, CrossfadeSettings, CrossfadeState, ListeningModeStatus } from "../models/audio.js"
import type { ListeningMode } from "../models/enums.js"

export class AudioController extends BaseController {
	volume(signal?: AbortSignal) {
		return this.getApi<AudioVolume>("/api/v2/audio/volume", undefined, signal)
	}
	setVolume(volume: number, signal?: AbortSignal) {
		return this.patchApi("/api/v2/audio/volume", { volume }, signal)
	}
	crossfade(signal?: AbortSignal) {
		return this.getApi<CrossfadeState>("/api/v2/audio/crossfade", undefined, signal)
	}
	setCrossfade(settings: CrossfadeSettings, signal?: AbortSignal) {
		return this.patchApi("/api/v2/audio/crossfade", settings, signal)
	}
	automix(signal?: AbortSignal) {
		return this.getApi<AutomixState>("/api/v2/audio/automix", undefined, signal)
	}
	setAutomix(settings: AutomixSettings, signal?: AbortSignal) {
		return this.patchApi("/api/v2/audio/automix", settings, signal)
	}
	atmos(signal?: AbortSignal) {
		return this.getApi<AtmosState>("/api/v2/audio/atmos", undefined, signal)
	}
	setAtmos(settings: AtmosSettings, signal?: AbortSignal) {
		return this.patchApi("/api/v2/audio/atmos", settings, signal)
	}
	listeningMode(signal?: AbortSignal) {
		return this.getApi<ListeningModeStatus>("/api/v2/audio/listening-mode", undefined, signal)
	}
	setListeningMode(mode: ListeningMode, signal?: AbortSignal) {
		return this.patchApi("/api/v2/audio/listening-mode", { mode }, signal)
	}
	capture(signal?: AbortSignal) {
		return this.getApi<CaptureState>("/api/v2/audio/capture", undefined, signal)
	}
	setCapture(settings: CaptureSettings, signal?: AbortSignal) {
		return this.patchApi("/api/v2/audio/capture", settings, signal)
	}
}
