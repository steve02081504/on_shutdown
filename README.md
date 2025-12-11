# on-shutdown

A robust, zero-dependency Node.js utility for handling graceful shutdowns and process cleanup.

It ensures your cleanup functions are reliably called when the process exits, whether triggered by signals (SIGINT, SIGTERM), errors (uncaught exceptions), or manual calls to `process.exit()`.

## Features

- **Simple API:** A single `on_shutdown` function to register your cleanup logic.
- **Process Integration:** Overrides `process.exit` to ensure cleanup hooks run even when you exit manually.
- **Error Safety:** Automatically catches `uncaughtException` and `unhandledRejection` to log errors and shut down gracefully.
- **Ordered Execution:** Functions are executed in a Last-In, First-Out (LIFO) order.
- **Async Support:** Supports asynchronous cleanup functions (Promises/async-await).
- **Resilient:** Robust error handling during the shutdown phase itself prevents hanging processes.
- **Customizable:** Full control over which signals or events trigger shutdown and their exit codes.

## Installation

```bash
npm install on-shutdown
```

## Usage

Import the `on_shutdown` function and register the functions you want to run on exit.

```javascript
// your-app.js
import { on_shutdown } from 'on-shutdown';
import process from 'node:process';

// --- Mock async functions ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Register cleanup logic
on_shutdown(async () => {
    console.log('Closing database connection...');
    await sleep(100);
    console.log('Database connection closed.');
});

on_shutdown(() => {
    console.log('Sync cleanup task...');
});

// --- Initialization ---
console.log('Application running. Press Ctrl+C or wait for exit.');

// Even if you call process.exit(), hooks will run!
setTimeout(() => {
    console.log('Calling process.exit(0)...');
    process.exit(0);
}, 2000);
```

### Output

```text
Application running. Press Ctrl+C or wait for exit.
Calling process.exit(0)...
Sync cleanup task...
Closing database connection...
Database connection closed.
```

## Default Behavior

By default, `on-shutdown` automatically sets up listeners for the following events:

| Event | Exit Code | Action |
| :--- | :--- | :--- |
| **SIGINT** | 130 | Standard shutdown (Ctrl+C). |
| **SIGTERM** | 143 | Standard shutdown (Docker/Kubernetes). |
| **SIGHUP** | 0 | Reload signal (treated as shutdown). |
| **error** | 1 | Logs error via `console.error` and exits. |
| **uncaughtException** | 1 | Logs error via `console.error` and exits. |
| **unhandledRejection**| 1 | Logs error via `console.error` and exits. |
| **beforeExit** | N/A | Runs hooks if event loop empties. |

## API

### `on_shutdown(func)`

Registers a function to be executed on process shutdown.

- `func` (Function): The function to execute. Can be synchronous or asynchronous.
- **Execution Order:** LIFO (Last-In, First-Out).

### `on_shutdown_error(func)`

Define a custom error handler for errors that occur *during* the execution of shutdown hooks.

- `func` (Function): A function that receives the error. Defaults to `console.error`.

```javascript
import { on_shutdown_error } from 'on-shutdown';

on_shutdown_error(async (err) => {
    // Send to logging service instead of console
    await myLogger.error('Error during shutdown:', err);
});
```

### `shutdown(code)`

Manually trigger the graceful shutdown sequence. This is the function that now powers `process.exit()`.

- `code` (Number): The exit code (optional).

```javascript
import { shutdown } from 'on-shutdown';

// Trigger shutdown manually with exit code 1
await shutdown(1);
```

### `set_shutdown_listener(event, code, event_fn)`

Register or modify a listener for a specific process event.

- `event` (String): The process event name (e.g., 'SIGINT', 'my-custom-event').
- `code` (Number): The exit code to use when this event triggers.
- `event_fn` (Function, optional): A specific callback to run for this event before shutdown logic begins.

```javascript
import { set_shutdown_listener } from 'on-shutdown';

// Change SIGINT to exit with code 0 instead of 130
set_shutdown_listener('SIGINT', 0);

// Listen to a custom signal
set_shutdown_listener('SIGUSR2', 0, () => console.log('Received SIGUSR2'));
```

### `unset_shutdown_listener(...events)`

Removes default or custom listeners. Useful if you want to handle specific signals entirely on your own.

- `...events` (String[]): List of event names to remove.

```javascript
import { unset_shutdown_listener } from 'on-shutdown';

// Stop handling unhandledRejection automatically
unset_shutdown_listener('unhandledRejection');
```
