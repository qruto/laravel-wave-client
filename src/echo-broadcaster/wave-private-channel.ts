import request from '../util/request';
import { authRequest } from '../channel-auth';

import WaveChannel from './wave-channel';

export default class WavePrivateChannel extends WaveChannel {
    protected whisperCallbacks = new Map<Function, Function>();

    protected auth: Promise<Response>;

    protected errorCallbacks: Function[] = [];

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

    public whisper(eventName, data) {
        request(this.connection)
            .post(this.options.endpoint + '/whisper', this.options, { channel_name: this.name, event_name: eventName, data })
            .catch(error => this.errorCallbacks.forEach((callback) => callback(error)));

        return this;
    }

    public listenForWhisper(event: string, callback: Function): WavePrivateChannel {
        let listener = function (data) {
            callback(Array.isArray(data) && data.length === 1 && typeof data[0] !== 'object' ? data[0] : data);
        };

        this.whisperCallbacks.set(callback, listener);

        super.listenForWhisper(event, listener);

        return this;
    }

    public stopListeningForWhisper(event: string, callback?: Function): WavePrivateChannel {
        if (callback) {
            callback = this.whisperCallbacks.get(callback);
            this.whisperCallbacks.delete(callback);
        }

        super.stopListeningForWhisper(event, callback);

        return this;
    }

    public on(event: string, callback: Function): WavePrivateChannel {
        this.auth.then(() => super.on(event, callback));

        return this;
    }

    public error(callback: Function): WaveChannel {
        this.errorCallbacks.push(callback);

        return this;
    }
}
