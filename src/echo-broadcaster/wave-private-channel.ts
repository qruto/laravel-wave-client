import request from '../util/request';
import { authRequest } from '../channel-auth';

import WaveChannel from './wave-channel';

export default class WavePrivateChannel extends WaveChannel {
    protected whisperCallbacks = new Map<CallableFunction, CallableFunction>();

    protected auth: Promise<Response>;

    protected errorCallbacks: CallableFunction[] = [];

    constructor(connection, name, options) {
        super(connection, name, options);

        this.subscribe();
    }

    public subscribe(): void {
        super.subscribe();

        this.auth = authRequest(this.name, this.connection, this.options);

        this.auth.catch(
            error => this.errorCallbacks.forEach((callback) => callback(error))
        );
    }

    public whisper(eventName: string, data: Record<any, any>): this {
        request(this.connection)
            .post(this.options.endpoint + '/whisper', this.options, { channel_name: this.name, event_name: eventName, data })
            .catch(error => this.errorCallbacks.forEach((callback) => callback(error)));

        return this;
    }

    public listenForWhisper(event: string, callback: CallableFunction): this {
        let listener = function (data) {
            callback(Array.isArray(data) && data.length === 1 && typeof data[0] !== 'object' ? data[0] : data);
        };

        this.whisperCallbacks.set(callback, listener);

        super.listenForWhisper(event, listener);

        return this;
    }

    public stopListeningForWhisper(event: string, callback?: CallableFunction): this {
        if (callback) {
            callback = this.whisperCallbacks.get(callback);
            this.whisperCallbacks.delete(callback);
        }

        super.stopListeningForWhisper(event, callback);

        return this;
    }

    public on(event: string, callback: CallableFunction): this {
        this.auth.then(() => super.on(event, callback));

        return this;
    }

    public error(callback: CallableFunction): this {
        this.errorCallbacks.push(callback);

        return this;
    }
}
