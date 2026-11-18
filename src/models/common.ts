import type { CiderScope } from "./enums.js"

export interface ClientInfo {
	framework: "dotnet" | "genten" | "universal"
	platform: "win32" | "darwin" | "linux" | "web"
	osVersion: string
	port: number
	production: boolean
	version: string
}
export interface AuthToken {
	token: string
	scopes: CiderScope[]
}
export interface AuthRequestBody {
	app_name: string
	scopes: CiderScope[]
	app_image?: string
}
export interface AuthLinkOptions {
	appName: string
	scopes: CiderScope[]
	appImage?: string
}
export interface AccountTokens {
	developerToken: string
	userToken: string
	storefront: string
}
export interface CiderOptions {
	baseUrl?: string
	token?: string
	fetch?: typeof fetch
	timeout?: number
}
export interface CiderRequestOptions {
	query?: Query
	body?: object
	signal?: AbortSignal
	timeout?: number
	auth?: boolean
}
export type ConfigValue = string | number | boolean | null | ConfigValue[] | { [key: string]: ConfigValue }
export interface CiderResponse<T> {
	data: T
	meta?: { offset: number; limit: number; total: number }
}
export interface CiderErrorBody {
	error: { code: string; message: string }
}
export class CiderApiError extends Error {
	readonly status: number
	readonly code: string
	readonly details: unknown
	readonly retryAfter?: string
	constructor(status: number, code: string, message: string, details?: unknown, retryAfter?: string) {
		super(message)
		this.name = "CiderApiError"
		this.status = status
		this.code = code
		this.details = details
		this.retryAfter = retryAfter
	}
}
export type Query = Record<string, string | number | boolean | null | undefined>
export interface Pagination extends Query {
	offset?: number
	limit?: number
}
export interface Artwork {
	url: string
	width: number
	height: number
}
export interface TrackSummary {
	id: string
	name: string
	artistName: string
	albumName?: string
	durationInMillis?: number
	artwork?: Artwork | string
	[key: string]: unknown
}
