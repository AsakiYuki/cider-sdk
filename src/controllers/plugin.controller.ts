import { BaseController } from "./base.controller.js"
export class PluginController extends BaseController {
	install(url: string, signal?: AbortSignal) {
		return this.postApi<{ identifier: string; name: string; version: string; installPath: string }>(
			"/api/v2/plugins/install",
			{ url },
			signal,
		)
	}
}
