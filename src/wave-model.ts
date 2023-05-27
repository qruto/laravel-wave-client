import { EventSourceConnection } from "./EventSourceConnection";
import { authRequest, AuthRequest } from "./channel-auth";
import { Options } from './echo-broadcaster/wave-connector';

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

        this.auth = authRequest(channelName, connection, this.options);

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

    protected listenEvent(event: string, callback: Function): WaveModel;
    protected listenEvent(model: string, event: string, callback: Function): WaveModel;
    protected listenEvent(model: string, event: string|Function, callback?: Function): WaveModel {
        const eventName = typeof event === 'string'
                ? event[0].toUpperCase() + event.slice(1)
                : model[0].toUpperCase() + model.slice(1);

        const listener = (data: { model: object }) => {
            typeof event === 'function' ? event(data.model) : callback(data.model);
        };

        this.callbackMap.set(typeof event === 'string' ? callback : event, listener);

        const modelClass = typeof event === 'string' ? model : this.name;

        this.connection.subscribe(`${this.channel}.${modelClass}${eventName}`, listener);

        return this;
    }

    public created(callback: Function): WaveModel;
    public created(model: string, callback: Function): WaveModel;
    public created(model: string|Function, callback?: Function): WaveModel {
        if (typeof model === 'function') {
            return this.listenEvent('created', model);
        }

        return this.listenEvent(model, 'created', callback);
    }

    public updated(callback: Function): WaveModel;
    public updated(model: string, callback: Function): WaveModel;
    public updated(model: string|Function, callback?: Function): WaveModel {
        if (typeof model === 'function') {
            return this.listenEvent('updated', model);
        }

        return this.listenEvent(model, 'updated', callback);
    }

    public deleted(callback: Function): WaveModel;
    public deleted(model: string, callback: Function): WaveModel;
    public deleted(model: string|Function, callback?: Function): WaveModel {
        if (typeof model === 'function') {
            return this.listenEvent('deleted', model);
        }

        return this.listenEvent(model, 'deleted', callback);
    }

    public restored(callback: Function): WaveModel;
    public restored(model: string, callback: Function): WaveModel;
    public restored(model: string|Function, callback?: Function): WaveModel {
        if (typeof model === 'function') {
            return this.listenEvent('restored', model);
        }

        return this.listenEvent(model, 'restored', callback);
    }

    public trashed(callback: Function): WaveModel;
    public trashed(model: string, callback: Function): WaveModel;
    public trashed(model: string|Function, callback?: Function): WaveModel {
        if (typeof model === 'function') {
            return this.listenEvent('trashed', model);
        }

        return this.listenEvent(model, 'trashed', callback);
    }

    public stopListening(event: string, callback: Function): WaveModel;
    public stopListening(model: string, event: string, callback: Function): WaveModel;
    public stopListening(model: string, event: string|Function, callback?: Function): WaveModel {
        const eventName = typeof event !== 'function' ? event[0].toUpperCase() + event.slice(1) : model[0].toUpperCase() + model.slice(1);

        const modelClass = typeof event === 'function' ? this.name : model;
        this.connection.removeListener(`${this.channel}.${modelClass}${eventName}`, this.callbackMap.get(typeof event === 'function' ? event : callback));

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
