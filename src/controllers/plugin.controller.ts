import { BaseController } from "./base.controller.js"
import type { PluginInstallResult } from "../models/plugins.js"

/** Builds the on-device plugin install deep link, which needs no token or scope. */
export function createPluginInstallLink(zipUrl: string): string {
	return `cider://install-plugin?${new URLSearchParams({ url: zipUrl }).toString()}`
}

export class PluginController extends BaseController {
	/** Waits on Cider's consent dialog, which gives the user 3 minutes to respond. */
	install(url: string, signal?: AbortSignal) {
		return this.requestApi<PluginInstallResult>("POST", "/api/v2/plugins/install", {
			body: { url },
			signal,
			timeout: 185_000,
		})
	}

	createInstallLink(zipUrl: string): string {
		return createPluginInstallLink(zipUrl)
	}
}
