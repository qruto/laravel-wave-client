import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source';

class RetriableError extends Error { }

class FatalError extends Error { }

interface Options {
    reconnect?: boolean;

    pauseInactive?: boolean;

    debug?: boolean;
}

export class EventSourceConnection {
    protected id: string;
    protected listeners: Record<string, Map<Function, (message: EventSourceMessage) => void>> = {};
    protected afterConnectCallbacks: ((connectionId) => void)[] = [];
    protected reconnecting = false;
    protected ctrl: AbortController;
    protected sourcePromise: Promise<void>;

    constructor(endpoint: string, request?: RequestInit, options?: Options) {
        options = {
            reconnect: true,
            pauseInactive: false,
            debug: true,
            ...options,
        }

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
                if (options.debug) {
                    debugEvent(message);
                }

                if (message.event === 'connected') {
                    this.id = message.data;

                    if (!this.reconnecting) {
                        this.afterConnectCallbacks.forEach(callback => callback(this.id));
                    }

                    this.reconnecting = false;

                    if (options.debug) {
                        console.log('Wave connected.');
                    }

                    return;
                }

                this.listeners[message.event]?.forEach(listener => listener({ ...message }));
            },
            onclose: () => {
                 if (this.ctrl.signal.aborted || !options.reconnect) {
                     if (options.debug) {
                         console.log('Wave disconnected.');
                     }
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
                    if (options.debug) {
                        console.log('Wave reconnecting...');
                    }
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


function debugEvent(message) {
    let data = message.data;

    try {
        // Attempt to parse as JSON
        let parsedData = JSON.parse(data);
        // If successful, replace the data with the stringified parsed data
        data = JSON.stringify(parsedData, null, 2);
    } catch (error) {
        // If it's not valid JSON, just leave the data as it is
    }

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    console.group(`Received server event ${hours}:${minutes}:${seconds}`);
    console.table({
        [message.id]: {
            event: message.event,
            data,
            retry: message.retry,
        }
    });
    console.log('Parsed data', JSON.parse(message.data));
    console.groupEnd();
}
