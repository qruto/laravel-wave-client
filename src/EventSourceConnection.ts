export class EventSourceConnection {
    protected id: string;
    public source: EventSource;

    protected listeners: Record<string, Map<Function, EventListener>> = {};
    protected afterConnectCallbacks: ((connectionId) => void)[] = [];
    protected reconnecting = false;

    public create(endpoint: string, withCredentials = false) {
        this.source = new EventSource(endpoint, { withCredentials });
        this.source.addEventListener('connected', (event: any) => {
            this.id = event.data;

            if (!this.reconnecting) {
                this.afterConnectCallbacks.forEach(callback => callback(this.id));
            }

            this.reconnecting = false;

            console.log('Wave connected.');
        });

        this.source.addEventListener('error', (event: any) => {
            switch (event.target.readyState) {
                case EventSource.CONNECTING:
                    this.reconnecting = true;
                    console.log('Wave reconnecting...');
                    break;

                case EventSource.CLOSED:
                    console.log('Wave connection closed');
                    this.create(endpoint, withCredentials);
                    this.resubscribe();
                    break;
            }
        }, false);
    }

    public getId() {
        return this.id;
    }

    private resubscribe() {
        for (let event in this.listeners) {
            this.listeners[event].forEach(listener => {
                this.source.addEventListener(event, listener);
            });
        }
    }

    public subscribe(event: string, callback: Function) {
        let listener = function (event: MessageEvent) {
            callback(JSON.parse(event.data).data);
        };

        if (!this.listeners[event]) {
            this.listeners[event] = new Map();
        }

        this.listeners[event].set(callback, listener);

        this.source.addEventListener(event, listener);
    }

    public unsubscribe(event: string) {
        this.listeners[event].forEach(listener => {
            this.source.removeEventListener(event, listener);
        });

        delete this.listeners[event];
    }

    public removeListener(event: string, callback: Function) {
        if (!this.listeners[event] || !this.listeners[event].has(callback)) {
            return;
        }

        this.source.removeEventListener(event, this.listeners[event].get(callback));

        this.listeners[event].delete(callback);

        if (this.listeners[event].size === 0) {
            delete this.listeners[event];
        }
    }

    public disconnect() {
        this.source.close();
    }

    public afterConnect(callback: (connectionId) => void) {
        this.afterConnectCallbacks.push(callback);
    }
}
