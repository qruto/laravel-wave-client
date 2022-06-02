import request from '../echo/util/request';
import WaveChannel from './wave-channel';

export default class WavePrivateChannel extends WaveChannel {
    protected authorized = false;

    protected afterAuthCallbacks: Record<string, (() => void)[]> = {};

    constructor(connection, name, options) {
        super(connection, name, options);

        request(connection).post(this.options.authEndpoint, { channel_name: this.name }).then(() => {
            this.authorized = true;

            Object.keys(this.afterAuthCallbacks).forEach((event) => {
                this.afterAuthCallbacks[event].forEach((callback) => callback());

                delete this.afterAuthCallbacks[event];
            });
        });
    }

    public whisper(eventName, data) {
        request(this.connection).post('whisper', { event_name: eventName, data });

        return this;
    }

    public on(event: string, callback: Function): WavePrivateChannel {
        if (this.authorized) {
            super.on(event, callback);

            return this;
        }

        if (!this.afterAuthCallbacks[event]) {
            this.afterAuthCallbacks[event] = [];
        }

        this.afterAuthCallbacks[event].push(() => {
            super.on(event, callback);
        });

        return this;
    }
}
