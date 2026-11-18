import type { CiderPlaybackEvent, CiderSocketFactory, CiderSocketLike } from "../models/events.js"

/** Connects to Cider's unauthenticated API:Playback Socket.IO broadcast channel. */
export class EventsController {
	private socket?: CiderSocketLike

	constructor(private readonly baseUrl: string) {}

	connect<Socket extends CiderSocketLike>(io: CiderSocketFactory<Socket>): Socket {
		this.disconnect()
		const socket = io(this.baseUrl, { transports: ["websocket", "polling"] })
		this.socket = socket
		return socket
	}

	onPlayback<T = unknown>(listener: (event: CiderPlaybackEvent<T>) => void): () => void {
		if (!this.socket) throw new Error("Call events.connect(io) before subscribing to playback events")
		const socket = this.socket
		const callback = (event: CiderPlaybackEvent) => listener(event as CiderPlaybackEvent<T>)
		socket.on("API:Playback", callback)
		return () => socket.off("API:Playback", callback)
	}

	disconnect(): void {
		this.socket?.disconnect()
		this.socket = undefined
	}
}
