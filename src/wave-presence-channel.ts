import WavePrivateChannel from './wave-private-channel';
import { PresenceChannel } from './echo/channel/presence-channel';
import  request from './echo/util/request';

export default class WavePresenceChannel extends WavePrivateChannel implements PresenceChannel {
    private onJoinCallback: Function;

    constructor(connection, name, options) {
        super(connection, name, options);

        request(connection).post('presence-channel-users', { channel: name }).then((users) => this.onJoinCallback(users));

        if (window) {
            window.addEventListener('beforeunload', () => this.unsubscribe());
        }
    }

    public here(callback: Function): WavePresenceChannel {
        this.onJoinCallback = callback;

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
        request(this.connection).delete('presence-channel-users', { channel: this.name });
        super.unsubscribe();
    }
}
