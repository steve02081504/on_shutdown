import process from 'node:process'

const shutdown_functions = []
export function on_shutdown(func) { shutdown_functions.unshift(func) }
let error_handler = console.error
export function on_shutdown_error(func) { error_handler = func }
const exit = process.exit
let is_shutting_down
export async function shutdown(code) {
	if (is_shutting_down) return
	is_shutting_down = true
	code ??= process.exitCode ?? 0
	for (const func of shutdown_functions) try {
		await func(code)
	} catch (error) {
		try { await error_handler(error) }
		catch (error) {
			try { await error_handler(error) } // you silly
			catch (error) { console.error(error) } // wtf bro?
		}
	}
	exit(code)
}
process.exit = shutdown
export function shutdown_with(...additional_fns_or_code) {
	let code
	if (Object(additional_fns_or_code.slice(-1)[0] ?? 0) instanceof Number) code = additional_fns_or_code.pop()
	return async _ => {
		for (const func of additional_fns_or_code) try { await func() } catch (error) { console.error(error) }
		await shutdown(code)
	}
}

export const shutdown_listeners = {}
export function set_shutdown_listener(event, code, event_fn) {
	unset_shutdown_listener(event)
	process.on(event, shutdown_listeners[event] = shutdown_with(() => event_fn?.(event), code))
}
export function unset_shutdown_listener(...events) {
	for (const event of events) {
		if (!shutdown_listeners[event]) continue
		process.off(event, shutdown_listeners[event])
		delete shutdown_listeners[event]
	}
}

set_shutdown_listener('SIGINT', 130)
set_shutdown_listener('SIGTERM', 143)
set_shutdown_listener('SIGHUP', 0)
set_shutdown_listener('error', 1, console.error)
set_shutdown_listener('uncaughtException', 1, console.error)
set_shutdown_listener('unhandledRejection', 1, console.error)
set_shutdown_listener('beforeExit')
