import { EventSourceConnection } from "./EventSourceConnection";

import { WaveModel } from "./wave-model";
import { Options } from './echo-broadcaster/wave-connector';

export class Wave {
    protected connection: EventSourceConnection;

    private models: Record<string, WaveModel> = {};

    private options: Options = {
        endpoint: '/wave',
        namespace: 'App.Models',
        auth: {
            headers: {},
        },
        authEndpoint: '/broadcasting/auth',
    }

    constructor(options?: Options) {
        this.options = { ...this.options, ...options };
        this.connection = new EventSourceConnection(this.options.endpoint, this.options);
    }

    public model(model: string, key: string) {
        const index = `${model}.${String(key)}`;

        if (!this.models[index]) {
            this.models[index] = new WaveModel(model, key, this.connection, this.options);
        }

        return this.models[index];
    }
}
