import request from './echo/util/request';
import WaveChannel from './wave-channel';

export default class WavePrivateChannel extends WaveChannel {
    protected authorized = false;

    protected afterAuthCallbacks: Record<string, (() => void)> = {};

    constructor(connection, name, options) {
        super(connection, name, options);

        request(connection).post(this.options.authEndpoint, { channel_name: this.name }).then(() => {
            this.authorized = true;

            Object.keys(this.afterAuthCallbacks).forEach((event) => {
                this.afterAuthCallbacks[event]();

                delete this.afterAuthCallbacks[event];
            });
        });
    }

    public whisper(eventName, data) {
        request(this.connection).post('whisper', { event_name: eventName, data });

        return this;
    }

    public async on(event: string, callback: Function): Promise<void> {
        if (this.authorized) {
            super.on(event, callback);

            return;
        }

        this.afterAuthCallbacks[event] = () => {
            super.on(event, callback);
        };
    }
}
