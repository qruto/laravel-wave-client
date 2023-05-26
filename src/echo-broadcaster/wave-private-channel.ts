import request from '../util/request';
import { AuthRequest, authRequest } from '../channel-auth';

import WaveChannel from './wave-channel';
import { Channel } from 'laravel-echo';

export default class WavePrivateChannel extends WaveChannel {
    protected authorized = false;

    protected afterAuthCallbacks: Record<string, (() => void)[]> = {};

    protected whisperCallbacks = new Map<Function, Function>();

    protected auth: AuthRequest;

    constructor(connection, name, options) {
        super(connection, name, options);

        this.auth = authRequest(name, connection, this.options);
    }

    public whisper(eventName, data) {
        request(this.connection).post(this.options.endpoint + '/whisper', { channel_name: this.name, event_name: eventName, data }, this.options);

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
        this.auth.after(() => super.on(event, callback));

        return this;
    }
}
