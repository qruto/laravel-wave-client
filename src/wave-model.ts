import { EventSourceConnection } from "./EventSourceConnection";
import { authRequest, AuthRequest } from "./channel-auth";

interface Options {
    namespace: string,
    authEndpoint:string,
}

const authMethods = [
    'created',
    'updated',
    'deleted',
    'restored',
    'trashed',
    'stopListening',
    'notification',
    'stopListeningNotification'
] as const;

export class WaveModel {
    public name: string;
    public key: string;
    protected connection: EventSourceConnection;
    protected channel: string;
    protected auth: AuthRequest;
    private callbackMap: Map<Function, Function> = new Map();
    private notificationCallbacks: Record<string, Set<Function>> = {};
    private options: Options;

    constructor(
        name: string,
        key: string,
        connection: EventSourceConnection,
        options: Options
    ) {
        this.name = name;
        this.key = key;
        this.connection = connection;
        this.options = options;

        const channelName = `${this.options.namespace}.${this.name}.${this.key}`;

        this.auth = authRequest(channelName, connection, this.options.authEndpoint);

        this.channel = `private-${channelName}`;

        const eventHandlerProxy = new Proxy(this, {
            get: (target, prop: typeof authMethods[number], receiver) => {
                const value = Reflect.get(target, prop, receiver);

                if (authMethods.includes(prop)) {
                    return (...args) => {
                        this.auth.after(() => value.apply(this, args));

                        return eventHandlerProxy;
                    };
                }

                return value;
            }
        });

        const notificationsListener = (data: { type: string }) => {
            if (this.notificationCallbacks[data.type]) {
                this.notificationCallbacks[data.type].forEach((callback) => callback(data));
            }
        }

        this.connection.subscribe(`${this.channel}.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated`, notificationsListener);

        return eventHandlerProxy;
    }

    protected listenEvent(event: string, callback: Function): WaveModel {
        const eventName = event[0].toUpperCase() + event.slice(1);

        const listener = (data: { model: object }) => {
            callback(data.model);
        };

        this.callbackMap.set(callback, listener);
        const modelClass = this.name.split('.').pop();
        console.log(`${this.channel}.${modelClass}${eventName}`);
        this.connection.subscribe(`${this.channel}.${modelClass}${eventName}`, listener);

        return this;
    }

    public created(callback: Function): WaveModel {
        return this.listenEvent('created', callback);
    }

    public updated(callback: Function): WaveModel {
        return this.listenEvent('updated', callback);
    }

    public deleted(callback: Function): WaveModel {
        return this.listenEvent('deleted', callback);
    }

    public restored(callback: Function): WaveModel {
        return this.listenEvent('restored', callback);
    }

    public trashed(callback: Function): WaveModel {
        return this.listenEvent('trashed', callback);
    }

    public stopListening(event: string, callback: Function): WaveModel {
        const eventName = event[0].toUpperCase() + event.slice(1);

        const modelClass = this.name.split('.').pop();
        this.connection.removeListener(`${this.channel}.${modelClass}${eventName}`, this.callbackMap.get(callback));

        return this;
    }

    public notification(type: string, callback: Function): WaveModel {
        if (! this.notificationCallbacks[type]) {
            this.notificationCallbacks[type] = new Set();
        }

        this.notificationCallbacks[type].add(callback);

        return this;
    }

    public stopListeningNotification(type: string, callback: Function): WaveModel {
        this.notificationCallbacks[type].delete(callback);

        return this;
    }
}
