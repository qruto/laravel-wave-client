import request from '../util/request';

import { PresenceChannel } from 'laravel-echo';

import WavePrivateChannel from './wave-private-channel';
import { AuthRequest, authRequest } from '../channel-auth';

export default class WavePresenceChannel extends WavePrivateChannel implements PresenceChannel {
    private joined = false;
    private joinRequest: AuthRequest;

    constructor(connection, name, options) {
        super(connection, name, options);

        this.joinRequest = authRequest(name, connection, { ...this.options, authEndpoint: this.options.endpoint + '/presence-channel-users' })
            .after(() => this.joined = true);

        this.joinRequest.response.catch(
            error => {
                this.errorCallbacks.forEach((callback) => callback(error));
            }
        )

        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', async () => await this.unsubscribe());
        }
    }

    public here(callback: Function): WavePresenceChannel {
        const getUsersList = async (response) => callback(await response.json());

        if (this.joined) {
            request(this.connection)
                .get(this.options.endpoint + '/presence-channel-users', this.options, { channel_name: this.name })
                .then(getUsersList)
                .catch((error) => this.errorCallbacks.forEach((callback) => callback(error)));

            return this;
        }

        this.joinRequest.after(getUsersList)

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

    public unsubscribe() {
        return new Promise((resolve, reject) => {
            this.joinRequest.after(() => {
                request(this.connection, true).delete(this.options.endpoint + '/presence-channel-users', this.options, { channel_name: this.name })
                    .then(() => {
                        super.unsubscribe();
                        resolve(null);
                    }).catch((error) => {
                        this.errorCallbacks.forEach((callback) => callback(error));
                        reject(error);
                    });
            });
        });
    }
}
