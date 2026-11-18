export interface QueueItem {
	track: { id: string; type: string; attributes?: Record<string, unknown> }
	source: string
	containerContext?: { type: string; id: string; name: string }
}
export interface QueueSnapshot {
	items: QueueItem[]
	position: number
}
export interface QueuePosition {
	position: number
	total: number
}
export interface SmartOptimizerStatus {
	enabled: boolean
	busy: boolean
	pending: number
	message: string | null
}
