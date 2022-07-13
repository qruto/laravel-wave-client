import request from '../util/request';
import { AuthRequest, authRequest } from '../channel-auth';

import WaveChannel from './wave-channel';

export default class WavePrivateChannel extends WaveChannel {
    protected authorized = false;

    protected afterAuthCallbacks: Record<string, (() => void)[]> = {};

    protected auth: AuthRequest;

    constructor(connection, name, options) {
        super(connection, name, options);

        this.auth = authRequest(name, connection, this.options.authEndpoint);
    }

    public whisper(eventName, data) {
        request(this.connection).post(this.options.endpoint + '/whisper', { channel_name: this.name, event_name: eventName, data });

        return this;
    }

    public on(event: string, callback: Function): WavePrivateChannel {
        this.auth.after(() => super.on(event, callback));

        return this;
    }
}
