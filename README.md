# on-shutdown

A lightweight, zero-dependency Node.js utility for registering graceful shutdown handlers.

Ensures your cleanup functions (e.g., closing database connections, releasing resources) are reliably called before the process exits. It hooks into process signals, uncaught exceptions, and even `process.exit()` calls.

## Features

- **Simple API:** A single `on_shutdown` function to register your cleanup logic.
- **Full Lifecycle Control:** Automatically handles `SIGINT`, `SIGTERM`, `SIGHUP`, `uncaughtException`, `unhandledRejection`, `beforeExit`, and patches `process.exit`.
- **Robust Error Handling:** Custom error handler support with multi-level fallbacks to ensure shutdown proceeds even if cleanup tasks fail.
- **Ordered Execution:** Functions are executed in a Last-In, First-Out (LIFO) order.
- **Async Support:** Supports asynchronous cleanup functions.
- **Zero Dependencies:** Tiny and dependency-free.

## Installation

```bash
npm install on-shutdown
```

## Usage

Import the `on_shutdown` function and register the functions you want to run on exit.

```javascript
import { on_shutdown } from 'on-shutdown';
import http from 'node:http';

// 1. Register cleanup tasks
on_shutdown(async () => {
    console.log('Cleanup: Closing database connection...');
    // await db.close();
});

const server = http.createServer((req, res) => res.end('Hello'));
server.listen(3000);

on_shutdown(async () => {
    console.log('Cleanup: Stopping HTTP server...');
    return new Promise(resolve => server.close(resolve));
});

console.log('Server running. Press Ctrl+C or kill the process to test shutdown.');

// 2. Process exit interception
// Calling process.exit() elsewhere in your code will now 
// automatically trigger the shutdown handlers defined above.
// setTimeout(() => process.exit(0), 5000); 
```

## API

### `on_shutdown(func)`

Registers a function to be executed on process shutdown.

- `func` (Function): The function to execute. Can be synchronous or asynchronous (return a Promise).

Functions are executed in a Last-In, First-Out (LIFO) stack.

### `on_shutdown_error(func)`

Sets a custom error handler for errors thrown during the shutdown process.
Default behavior is `console.error`.

- `func` (Function): A function that receives the error object.

```javascript
import { on_shutdown_error } from 'on-shutdown';

on_shutdown_error((err) => {
    // Send to logging service instead of stderr
    logger.error('Error during shutdown:', err);
});
```

### `shutdown(code)`

Manually triggers the shutdown sequence. This is also what `process.exit()` maps to.

- `code` (Number, optional): The exit code. Defaults to `process.exitCode` or `0`.

```javascript
import { shutdown } from 'on-shutdown';

// Trigger graceful shutdown manually with exit code 1
await shutdown(1);
```

### `set_shutdown_listener(event, code, event_fn)`

Registers or updates a listener for a specific process event.

- `event` (String): The process event name (e.g., 'SIGINT', 'uncaughtException').
- `code` (Number): The exit code to use when this event triggers shutdown.
- `event_fn` (Function, optional): An optional callback to run immediately when the event fires, before the shutdown sequence begins.

### `unset_shutdown_listener(event)`

Removes the shutdown listener for a specific event. Useful if you want to handle specific signals entirely on your own or conflict with another library.

```javascript
import { unset_shutdown_listener } from 'on-shutdown';

// Disable default handling of uncaught exceptions
unset_shutdown_listener('uncaughtException');
```

## Default Behaviors

By default, `on-shutdown` registers listeners for the following events:

| Event | Exit Code | Notes |
| :--- | :--- | :--- |
| `SIGINT` | 130 | Typically Ctrl+C |
| `SIGTERM` | 143 | Termination signal |
| `SIGHUP` | 0 | Hangup detected |
| `uncaughtException` | 1 | Logs error via `console.error` before shutdown |
| `unhandledRejection` | 1 | Logs error via `console.error` before shutdown |
| `beforeExit` | *current* | Triggered when event loop is empty |

Additionally, `process.exit` is patched to execute the shutdown sequence before actually exiting the process.
