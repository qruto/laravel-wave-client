import request from "./echo/util/request";
import { EventSourceConnection } from "./EventSourceConnection";
import { WaveModel } from "./wave-model";

export class Wave {
    protected connection: EventSourceConnection;

    private models: Record<string, WaveModel> = {};

    private callbackMap: Map<Function, Function> = new Map();

    constructor() {
        this.connection = new EventSourceConnection();
        this.connection.create();
    }

    public model(model: string) {
        if (!this.models[model]) {
            this.models[model] = new WaveModel(model, this.connection);
        }

        return this.models[model];
    }

    public listenForWhisper(event: string, callback: Function): Wave {
        const listener = (data: { data: object }) => {
            callback(data.data);
        };

        this.callbackMap.set(callback, listener);
        this.connection.subscribe('private-wave.client-' + event, listener);

        return this;
    }

    public whisper(event: string, payload: object) {
        return request(this.connection).post('whisper', { event_name: event, data: payload });
    }

    /**
     * Stop listening for a whisper event on the channel instance.
     */
    public stopListeningForWhisper(event: string, callback?: Function): Wave {
        if (callback) {
            this.connection.removeListener('private-wave.client-' + event, this.callbackMap.get(callback));
        } else {
            this.connection.unsubscribe('private-wave.client-' + event);
        }

        return this;
    }
}
