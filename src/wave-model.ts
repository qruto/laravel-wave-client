import { EventSourceConnection } from "./EventSourceConnection";
import { authRequest, AuthRequest } from "./channel-auth";

const events = [
    'retrieved',
    'creating',
    'created',
    'updating',
    'updated',
    'saving',
    'saved',
    'deleting',
    'deleted',
    'restoring',
    'restored',
    'replicating'
];

export class WaveModel {
    public id: string;
    protected connection: EventSourceConnection;
    protected modelClass: string;
    protected channelPrefix: string;
    protected auth: AuthRequest;
    private callbackMap: Map<Function, Function> = new Map();

    constructor(
        id: string,
        connection: EventSourceConnection
    ) {
        this.id = id;
        this.connection = connection;

        const parts = id.split('.');

        this.modelClass = parts[parts.length-2];

        this.auth = authRequest(id, connection);

        this.channelPrefix = `private-${this.id}`;

        const eventHandlerProxy = new Proxy(this, {
            get: (target, prop, receiver) => {
                const value = Reflect.get(target, prop, receiver);

                if (
                    typeof prop !== 'symbol'
                    && typeof value === 'function'
                    && ['stopListening', 'notification', 'stopListeningNotification'].includes(prop)
                ) {
                    return (...args) => {
                        this.auth.after(() => value.apply(this, args));

                        return eventHandlerProxy;
                    };
                }

                return typeof prop !== 'symbol' && events.includes(prop)
                    ? (callback: Function) => {
                        this.auth.after(() => target.listenEvent.call(this, prop, callback));

                        return eventHandlerProxy;
                    } : value;
            }
        });

        return eventHandlerProxy;
    }

    protected listenEvent(event: string, callback: Function): WaveModel {
        const eventName = event[0].toUpperCase() + event.slice(1);

        const listener = (data: { model: object }) => {
            callback(data.model);
        };

        this.callbackMap.set(callback, listener);
        this.connection.subscribe(`${this.channelPrefix}.${this.modelClass}${eventName}`, listener);

        return this;
    }

    public stopListening(event: string, callback: Function): WaveModel {
        const eventName = event[0].toUpperCase() + event.slice(1);

        this.connection.removeListener(`${this.channelPrefix}.${this.modelClass}${eventName}`, this.callbackMap.get(callback));

        return this;
    }

    public notification(callback: Function): WaveModel {
        this.connection.subscribe(`${this.channelPrefix}.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated`, callback);

        return this;
    }

    public stopListeningNotification(callback: Function): WaveModel {
        this.connection.removeListener(`${this.channelPrefix}.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated`, callback);

        return this;
    }
}
