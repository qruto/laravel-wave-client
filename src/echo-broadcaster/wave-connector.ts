import { Connector } from 'laravel-echo';

import { EventSourceConnection } from '../EventSourceConnection';

import WaveChannel from './wave-channel';
import WavePrivateChannel from './wave-private-channel';
import WavePresenceChannel from './wave-presence-channel';

export interface Options {
    endpoint?: string,

    namespace: string,

    auth?: {
        headers: Record<string, string>,
    },

    authEndpoint?: string,

    csrfToken?: string,

    bearerToken?: string,

    request?: RequestInit,

    pauseInactive?: boolean,

    debug?: boolean,
}

export class WaveConnector extends Connector {
    private connection: EventSourceConnection;

    private channels: Record<string, WaveChannel | WavePresenceChannel> = {};

    constructor(options: Options) {
        super({ endpoint: '/wave', ...options });
    }

    connect() {
        this.connection = new EventSourceConnection(this.options.endpoint, this.options);

        this.connection.on('reconnect', () => {
            for (let name in this.channels) {
                this.channels[name].subscribe();
            }
        });
    }

    public channel(channel: string): WaveChannel {
        if (!this.channels[channel]) {
            this.channels[channel] = new WaveChannel(this.connection, channel, this.options);
        }

        return this.channels[channel] as WaveChannel;
    }

    public presenceChannel(channel): WavePresenceChannel {
        if (!this.channels['presence-' + channel]) {
            this.channels['presence-' + channel] = new WavePresenceChannel(this.connection, 'presence-' + channel, this.options);
        }

        return this.channels['presence-' + channel] as WavePresenceChannel;
    }

    public privateChannel(channel): WavePrivateChannel {
        if (!this.channels['private-' + channel]) {
            this.channels['private-' + channel] = new WavePrivateChannel(this.connection, 'private-' + channel, this.options);
        }

        return this.channels['private-' + channel] as WavePrivateChannel;
    }

    public disconnect() {
        this.connection.disconnect();
    }

    public leave(channel: string): void {
        let channels = [channel, 'private-' + channel, 'presence-' + channel];

        channels.forEach((name: string) => {
            this.leaveChannel(name);
        });
    }

    /**
     * Leave the given channel.
     */
    public leaveChannel(channel: string): void {
        if (this.channels[channel]) {
            this.channels[channel].unsubscribe();

            delete this.channels[channel];
        }
    }

    socketId() {
        return this.connection.getId();
    }
}
