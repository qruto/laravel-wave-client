import request from '../util/request';

import { PresenceChannel } from 'laravel-echo';

import WavePrivateChannel from './wave-private-channel';
import { AuthRequest, authRequest } from '../channel-auth';

export default class WavePresenceChannel extends WavePrivateChannel implements PresenceChannel {
    private joined = false;
    private joinRequest: AuthRequest;

    constructor(connection, name, options) {
        super(connection, name, options);

        // TODO: custom route
        this.joinRequest = authRequest(name, connection, 'wave/presence-channel-users')
            .after(() => this.joined = true);

        if (window) {
            window.addEventListener('beforeunload', () => this.unsubscribe());
        }
    }

    public here(callback: Function): WavePresenceChannel {
        if (this.joined) {
            request(this.connection)
                .get('wave/presence-channel-users', { channel_name: this.name })
                .then((users) => callback(users));

            return this;
        }

        this.joinRequest.after((users) => callback(users))

        return this;
    }

    /**
     * Listen for someone joining the channel.
     */
    public joining(callback: Function): WavePresenceChannel {
        this.listen('.join', callback);

        return this;
    }

    /**
     * Listen for someone leaving the channel.
     */
    public leaving(callback: Function): WavePresenceChannel {
        this.listen('.leave', callback);

        return this;
    }

    public unsubscribe(): void {
        this.joinRequest.after(() => {
            request(this.connection).delete('wave/presence-channel-users', { channel_name: this.name });
            super.unsubscribe();
        });
    }
}
