import type { AuthLinkOptions, AuthRequestBody, AuthToken, CiderOptions } from "../models/common.js"
import { CiderHttpClient } from "../services/http-client.js"

export interface RequestAuthTokenOptions extends Pick<CiderOptions, "baseUrl" | "fetch"> {
	signal?: AbortSignal
}

/** Rejects consent requests Cider would answer with 400 INVALID_REQUEST, without the round trip. */
function assertConsentRequest(appName: string, scopes: readonly unknown[]): void {
	if (!appName?.trim() || appName.length > 64) {
		throw new RangeError("appName must contain 1 to 64 characters")
	}
	if (scopes.length === 0) {
		throw new RangeError("At least one API scope is required")
	}
}

/** Requests a Cider API token directly. This endpoint does not require an existing token. */
export async function requestAuthToken(
	input: AuthRequestBody,
	options: RequestAuthTokenOptions = {},
): Promise<AuthToken> {
	assertConsentRequest(input.app_name, input.scopes)
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
	assertConsentRequest(options.appName, options.scopes)
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
		assertConsentRequest(input.app_name, input.scopes)
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
