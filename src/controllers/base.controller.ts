import type { CiderHttpClient } from "../services/http-client.js"
import type { CiderRequestOptions, Query } from "../models/common.js"

export abstract class BaseController {
	constructor(protected readonly client: CiderHttpClient) {}
	/** Escape hatch for endpoints needing a non-default timeout, e.g. ones gated on a user dialog. */
	protected requestApi<T = unknown>(method: string, path: string, options?: CiderRequestOptions) {
		return this.client.request<T>(method, path, options)
	}
	protected getApi<T>(path: string, query?: Query, signal?: AbortSignal) {
		return this.client.get<T>(path, query, signal)
	}
	protected postApi<T = unknown>(path: string, body?: object, signal?: AbortSignal) {
		return this.client.post<T>(path, body, signal)
	}
	protected patchApi<T = unknown>(path: string, body: object, signal?: AbortSignal) {
		return this.client.patch<T>(path, body, signal)
	}
	protected putApi<T = unknown>(path: string, body?: object, signal?: AbortSignal) {
		return this.client.put<T>(path, body, signal)
	}
	protected deleteApi<T = unknown>(path: string, body?: object, signal?: AbortSignal) {
		return this.client.delete<T>(path, body, signal)
	}
	protected id(value: string | number) {
		return this.client.id(value)
	}
}
