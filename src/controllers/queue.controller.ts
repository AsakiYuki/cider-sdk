import { BaseController } from "./base.controller.js"

export class QueueController extends BaseController {
	list(pagination: Pagination = {}, signal?: AbortSignal) {
		return this.getApi<QueueSnapshot>("/api/v2/queue", pagination, signal)
	}
	position(signal?: AbortSignal) {
		return this.getApi<QueuePosition>("/api/v2/queue/position", undefined, signal)
	}
	jump(index: number, signal?: AbortSignal) {
		return this.postApi("/api/v2/queue/jump", { index }, signal)
	}
	addNext(type: MusicKitType, id: string, signal?: AbortSignal) {
		return this.postApi("/api/v2/queue/add-next", { type, id }, signal)
	}
	addLater(type: MusicKitType, id: string, signal?: AbortSignal) {
		return this.postApi("/api/v2/queue/add-later", { type, id }, signal)
	}
	remove(index: number, signal?: AbortSignal) {
		return this.deleteApi(`/api/v2/queue/items/${index}`, undefined, signal)
	}
	move(from: number, to: number, signal?: AbortSignal) {
		return this.postApi("/api/v2/queue/move", { from, to }, signal)
	}
	clear(signal?: AbortSignal) {
		return this.deleteApi("/api/v2/queue", undefined, signal)
	}
	shuffle(signal?: AbortSignal) {
		return this.postApi("/api/v2/queue/shuffle", undefined, signal)
	}
	smartOptimizer(signal?: AbortSignal) {
		return this.getApi<SmartOptimizerStatus>("/api/v2/queue/smart-optimizer", undefined, signal)
	}
	toggleSmartOptimizer(signal?: AbortSignal) {
		return this.postApi("/api/v2/queue/smart-optimizer/toggle", undefined, signal)
	}
}
