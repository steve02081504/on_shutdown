# on-shutdown

A lightweight, zero-dependency Node.js utility for registering graceful shutdown handlers.

Ensures your cleanup functions (e.g., closing database connections, releasing resources) are reliably called before the process exits.

## Features

- **Simple API:** A single `on_shutdown` function to register your cleanup logic.
- **Zero Dependencies:** Tiny and dependency-free.
- **Reliable:** Handles common process termination signals (`SIGINT`, `SIGTERM`, `SIGHUP`) and the `exit` event.
- **Ordered Execution:** Functions are executed in a Last-In, First-Out (LIFO) order, allowing you to tear down components in the reverse order of their initialization.
- **Async Support:** Supports asynchronous cleanup functions.

## Installation

```bash
npm install on-shutdown
```

## Usage

Import the `on_shutdown` function and register the functions you want to run on exit.

```javascript
// your-app.js
import { on_shutdown } from 'on-shutdown';

// --- Mock async functions for demonstration ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function connectToDatabase() {
    console.log('Connecting to database...');
    await sleep(100);
}

async function closeDatabaseConnection() {
    console.log('Closing database connection...');
    await sleep(100);
}

async function startServer() {
    console.log('Starting server...');
    await sleep(100);
    return { close: async () => stopServer() }; // Mock server object
}

async function stopServer() {
    console.log('Stopping server...');
    await sleep(100);
}


// --- Initialization ---
console.log('Application starting...');

// Connect to the database
await connectToDatabase();
console.log('Database connection established.');
on_shutdown(async () => {
    await closeDatabaseConnection();
    console.log('Database connection closed.');
});

// Start the web server
const server = await startServer();
console.log('Server is listening.');
on_shutdown(async () => {
    await server.close();
    console.log('Server stopped.');
});

console.log('Application is running. Press Ctrl+C to exit.');

// --- Keep the process alive (for demonstration) ---
// In a real app, your server or other long-running tasks would do this.
setInterval(() => {}, 1000);
```

When you terminate the application (e.g., with `Ctrl+C`), you will see the shutdown functions execute in the correct LIFO order:

```
Application starting...
Database connection established.
Server is listening.
Application is running. Press Ctrl+C to exit.
^C
Stopping server...
Server stopped.
Closing database connection...
Database connection closed.
```

## API

### `on_shutdown(func)`

Registers a function to be executed on process shutdown.

- `func` (Function): The function to execute. Can be synchronous or asynchronous (return a Promise).

Functions are executed in a Last-In, First-Out (LIFO) stack.
