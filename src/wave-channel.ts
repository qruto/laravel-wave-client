import { Channel } from './echo/channel/channel';
import { EventFormatter } from './echo/util/event-formatter';
import { EventSourceConnection } from './EventSourceConnection';

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
    events: any = {};

    /**
     * Create a new class instance.
     */
    constructor(connection, name, options) {
        super();

        /**
         * The event callbacks applied to the channel.
         */
        this.events = {};
        this.name = name;
        this.connection = connection;
        this.options = options;
        this.eventFormatter = new EventFormatter(this.options.namespace);
    }

    subscribed(callback: Function): Channel {
        return this;
    }

    error(callback: Function): Channel {
        return this;
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
        this.connection.unsubscribe(event);
        delete this.events[name];

        return this;
    }

    /**
     * Bind the channel's socket to an event and store the callback.
     */
    public on(event: string, callback: Function) {
        this.events[event] = callback;
        this.connection.subscribe(`${this.name}.${event}`, callback);
    }

    public unsubscribe(): void {
        Object.keys(this.events).forEach((event) => {
            this.events[event].forEach((callback) => {
                this.connection.unsubscribe(`${this.name}.${event}`);
            });

            delete this.events[event];
        });
    }
}
