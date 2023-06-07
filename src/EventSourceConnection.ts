import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source';

class RetriableError extends Error { }

class FatalError extends Error { }

interface Options {
    reconnect?: boolean;

    pauseInactive?: boolean;
}

export class EventSourceConnection {
    protected id: string;
    protected listeners: Record<string, Map<Function, (message: EventSourceMessage) => void>> = {};
    protected afterConnectCallbacks: ((connectionId) => void)[] = [];
    protected reconnecting = false;
    protected ctrl: AbortController;
    protected sourcePromise: Promise<void>;

    constructor(endpoint: string, request?: RequestInit, options: Options = { reconnect: true }) {
        this.ctrl = new AbortController();

        let formattedHeaders: Record<string, string> = {};

        if (request?.headers) {
            if (request.headers instanceof Headers) {
                request.headers.forEach((value, key) => {
                    formattedHeaders[key] = value;
                });
            } else if (Array.isArray(request.headers)) {
                formattedHeaders = Object.fromEntries(request.headers);
            } else {
                formattedHeaders = request.headers;
            }
        }

        this.sourcePromise = fetchEventSource(endpoint, {
             signal: this.ctrl.signal,
            ...{
                ...request,
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Connection': 'keep-alive',
                    ...formattedHeaders,
                }
            },
            openWhenHidden: typeof options.pauseInactive === 'undefined' ? true : !options.pauseInactive,
            async onopen(response) {
                if (response.ok && response.headers.get('content-type').startsWith('text/event-stream')) {
                    return; // everything's good
                } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                    // client-side errors are usually non-retriable:
                    throw new FatalError();
                } else {
                    throw new RetriableError();
                }
            },
            onmessage: (message) => {
                // if the server emits an error message, throw an exception
                // so it gets handled by the onerror callback below:
                if (message.event === 'connected') {
                    this.id = message.data;

                    if (!this.reconnecting) {
                        this.afterConnectCallbacks.forEach(callback => callback(this.id));
                    }

                    this.reconnecting = false;

                    console.log('Wave connected.');

                    return;
                }

                this.listeners[message.event]?.forEach(listener => listener({ ...message }));
            },
            onclose: () => {
                 if (this.ctrl.signal.aborted || !options.reconnect) {
                    console.log('Wave disconnected.');
                    return;
                 }
                // if the server closes the connection unexpectedly, retry:
                throw new RetriableError();
            },
            onerror: (err) => {
                if (err instanceof FatalError || 'matcherResult' in err) {
                    throw err; // rethrow to stop the operation
                } else {
                    // do nothing to automatically retry. You can also
                    // return a specific retry interval here.
                    this.reconnecting = true;
                    console.log('Wave reconnecting...');
                }
            },
        });
    }

    public getId() {
        return this.id;
    }

    public getSourcePromise() {
        return this.sourcePromise;
    }

    public subscribe(event: string, callback: Function) {
        let listener = function (event: EventSourceMessage) {
            callback(JSON.parse(event.data));
        };

        if (!this.listeners[event]) {
            this.listeners[event] = new Map();
        }

        this.listeners[event].set(callback, listener);
    }

    public unsubscribe(event: string) {
        delete this.listeners[event];
    }

    public removeListener(event: string, callback: Function) {
        if (!this.listeners[event] || !this.listeners[event].has(callback)) {
            return;
        }

        this.listeners[event].delete(callback);

        if (this.listeners[event].size === 0) {
            delete this.listeners[event];
        }
    }

    public disconnect() {
        this.ctrl.abort('disconnect');
    }

    public afterConnect(callback: (connectionId) => void) {
        this.afterConnectCallbacks.push(callback);
    }
}
