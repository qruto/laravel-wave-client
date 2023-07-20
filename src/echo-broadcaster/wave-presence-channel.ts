import request from '../util/request';

import { PresenceChannel } from 'laravel-echo';

import WavePrivateChannel from './wave-private-channel';
import { authRequest } from '../channel-auth';

export default class WavePresenceChannel extends WavePrivateChannel implements PresenceChannel {
    private joined = false;
    private join: Promise<Response>;

    constructor(connection, name, options) {
        super(connection, name, options);

        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', async () => await this.unsubscribe());
        }
    }

    public subscribe(): void {
        super.subscribe();

        this.join = authRequest(this.name, this.connection, { ...this.options, authEndpoint: this.options.endpoint + '/presence-channel-users' })
            .then((response) => {
                this.joined = true;

                return response;
            });

        this.join.catch(error => {
            this.errorCallbacks.forEach((callback) => callback(error));
        })
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

        this.join.then(getUsersList)

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
            this.join.then(() => {
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
