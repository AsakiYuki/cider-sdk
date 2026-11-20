import {
	CiderApiError,
	CiderTimeoutError,
	type CiderOptions,
	type CiderRequestOptions,
	type CiderResponse,
	type Query,
} from "../models/common.js"

/** Shared HTTP transport used by all API services. */
export class CiderHttpClient {
	readonly baseUrl: string
	private token?: string
	private readonly fetcher: typeof fetch
	private readonly timeout: number

	constructor(options: CiderOptions = {}) {
		this.baseUrl = (options.baseUrl ?? "http://127.0.0.1:10767").replace(/\/+$/, "")
		this.token = options.token
		if (typeof (options.fetch ?? globalThis.fetch) !== "function") {
			throw new TypeError("No fetch implementation available. Use Node 18+, or pass one as `options.fetch`.")
		}
		// Bind the global: browsers reject `fetch` invoked as a method of anything but Window.
		this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis)
		this.timeout = options.timeout ?? 30_000
	}

	setToken(token?: string): void {
		this.token = token
	}
	getToken(): string | undefined {
		return this.token
	}

	async request<T>(method: string, path: string, options: CiderRequestOptions = {}): Promise<CiderResponse<T>> {
		// Guard here rather than leaving it to the fetch implementation, which may be injected.
		if (options.signal?.aborted) throw options.signal.reason
		const url = new URL(`${this.baseUrl}${path}`)
		for (const [key, value] of Object.entries(options.query ?? {})) {
			if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
		}
		const timeout = options.timeout ?? this.timeout
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(new CiderTimeoutError(timeout)), timeout)
		const abort = () => controller.abort(options.signal?.reason)
		options.signal?.addEventListener("abort", abort, { once: true })
		try {
			const response = await this.fetcher(url, {
				method,
				headers: {
					accept: "application/json",
					...(this.token && options.auth !== false ? { apptoken: this.token } : {}),
					...(options.body ? { "content-type": "application/json" } : {}),
				},
				...(options.body ? { body: JSON.stringify(options.body) } : {}),
				signal: controller.signal,
			})
			const payload: unknown = response.status === 204 ? {} : await response.json().catch(() => ({}))
			if (!response.ok) {
				const error = (payload as { error?: { code?: string; message?: string } })?.error
				throw new CiderApiError(
					response.status,
					error?.code ?? "HTTP_ERROR",
					error?.message ?? (response.statusText || "Cider API request failed"),
					payload,
					response.headers.get("retry-after") ?? undefined,
				)
			}
			return payload as CiderResponse<T>
		} finally {
			clearTimeout(timeoutId)
			options.signal?.removeEventListener("abort", abort)
		}
	}

	get<T>(path: string, query?: Query, signal?: AbortSignal) {
		return this.request<T>("GET", path, { query, signal })
	}
	post<T>(path: string, body?: object, signal?: AbortSignal) {
		return this.request<T>("POST", path, { body, signal })
	}
	patch<T>(path: string, body: object, signal?: AbortSignal) {
		return this.request<T>("PATCH", path, { body, signal })
	}
	put<T>(path: string, body?: object, signal?: AbortSignal) {
		return this.request<T>("PUT", path, { body, signal })
	}
	delete<T>(path: string, body?: object, signal?: AbortSignal) {
		return this.request<T>("DELETE", path, { body, signal })
	}
	id(value: string | number) {
		return encodeURIComponent(String(value))
	}
}
