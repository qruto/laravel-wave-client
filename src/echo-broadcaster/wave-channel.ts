import { Channel } from "laravel-echo";
import { EventFormatter } from '../echo/event-formatter';

import { EventSourceConnection } from '../EventSourceConnection';

export default class WaveChannel extends Channel {

    /**
     * Server sent event connector instance
     */
    connection: EventSourceConnection;

    /**
     * The name of the channel
     */
    name: string;

    /**
     * Channel options
     */
    options: any;

    /**
     * The event formatter.
     */
    eventFormatter: EventFormatter;

    /**
     * The event callbacks applied to the channel.
     */
    protected events: string[] = [];

    /**
     * Create a new class instance.
     */
    constructor(connection, name, options) {
        super();

        /**
         * The event callbacks applied to the channel.
         */
        this.name = name;
        this.connection = connection;
        this.options = options;
        this.eventFormatter = new EventFormatter(this.options.namespace);
    }

    /**
     * Listen for an event on the channel instance.
     */
    listen(event, callback) {
        this.on(this.eventFormatter.format(event), callback);

        return this;
    }
    /**
     * Stop listening for an event on the channel instance.
     */
    stopListening(event) {
        const name = this.eventFormatter.format(event);
        this.connection.unsubscribe(`${this.name}.${name}`);
        this.events = this.events.filter(e => e !== name);

        return this;
    }

    /**
     * Bind the channel's socket to an event and store the callback.
     */
    public on(event: string, callback: Function): WaveChannel {
        if (!this.events.find(e => e === event)) {
            this.events.push(event);
        }

        this.connection.subscribe(`${this.name}.${event}`, callback);

        return this;
    }

    public subscribe(): void {
        return;
    }

    public unsubscribe(): void {
        this.events.forEach(event => {
            this.connection.unsubscribe(`${this.name}.${event}`);
        });

        this.events = [];
    }

    subscribed(callback: (id: string) => void): WaveChannel {
        this.connection.on('connected', callback)

        return this;
    }

    error(callback: Function): WaveChannel {
        return callback();
    }
}
