export interface CiderPlaybackEvent<T = unknown> {
	type: string
	data: T
}

/** Structural socket type keeps socket.io-client optional for SDK consumers. */
export interface CiderSocketLike {
	on(event: "API:Playback", listener: (payload: CiderPlaybackEvent) => void): this
	off(event: "API:Playback", listener: (payload: CiderPlaybackEvent) => void): this
	disconnect(): void
}

export type CiderSocketFactory<Socket extends CiderSocketLike = CiderSocketLike> = (
	url: string,
	options: { transports: ["websocket", "polling"] },
) => Socket
