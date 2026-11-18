import type { AuthLinkOptions, AuthRequestBody, AuthToken } from "../models/types.js"
import { CiderHttpClient } from "../services/http-client.js"
import type { CiderOptions } from "../models/common.js"

export interface RequestAuthTokenOptions extends Pick<CiderOptions, "baseUrl" | "fetch"> {
	signal?: AbortSignal
}

/** Requests a Cider API token directly. This endpoint does not require an existing token. */
export async function requestAuthToken(
	input: AuthRequestBody,
	options: RequestAuthTokenOptions = {},
): Promise<AuthToken> {
	const client = new CiderHttpClient(options)
	const response = await client.request<AuthToken>("POST", "/api/v2/auth/request", {
		body: input,
		signal: options.signal,
		auth: false,
		timeout: 125_000,
	})
	return response.data
}

/** Builds the same-device Cider consent deep link. */
export function createAuthLink(options: AuthLinkOptions): string {
	if (!options.appName.trim() || options.appName.length > 64) {
		throw new RangeError("appName must contain 1 to 64 characters")
	}
	if (options.scopes.length === 0) {
		throw new RangeError("At least one API scope is required")
	}

	const query = new URLSearchParams({
		"app-name": options.appName,
		scopes: options.scopes.join(","),
	})
	if (options.appImage) query.set("app-image", options.appImage)
	return `cider://request-auth?${query.toString()}`
}

/** Auth helpers for direct consent requests and same-device deep links. */
export class AuthController {
	constructor(private readonly client: CiderHttpClient) {}

	createLink(options: AuthLinkOptions): string {
		return createAuthLink(options)
	}

	async requestToken(input: AuthRequestBody, signal?: AbortSignal) {
		const response = await this.client.request<AuthToken>("POST", "/api/v2/auth/request", {
			body: input,
			signal,
			auth: false,
			timeout: 125_000,
		})
		this.client.setToken(response.data.token)
		return response
	}
}
