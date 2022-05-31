export class EventSourceConnection {
    public source: EventSource;
    protected id: string;

    protected listeners: Record<string, EventListener> = {};
    protected afterConnectCallbacks: ((connectionId) => void)[] = [];

    public create() {
        //TODO: dynamic route
        this.source = new EventSource('/wave')
        this.source.addEventListener('connected', (event: any) => {
            this.id = event.data;
            this.afterConnectCallbacks.forEach(callback => callback(this.id));
        });

        this.source.addEventListener('error', (event: any) => {
            switch (event.target.readyState) {
                case EventSource.CONNECTING:
                    console.log('Reconnecting...');
                    break;

                case EventSource.CLOSED:
                    this.create();
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
            this.subscribe(event, this.listeners[event]);
        }
    }

    public subscribe(event: string, callback: Function) {
        let listener = function (event: MessageEvent) {
            callback(JSON.parse(event.data).data);
        };

        this.listeners[event] = listener;
        this.source.addEventListener(event, listener);
    }

    public unsubscribe(event: string) {
        this.source.removeEventListener(event, this.listeners[event]);
        delete this.listeners[event];
    }

    public disconnect() {
        this.source.close();
    }

    public afterConnect(callback: (connectionId) => void) {
        this.afterConnectCallbacks.push(callback);
    }
}
