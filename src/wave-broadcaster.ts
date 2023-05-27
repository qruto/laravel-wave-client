import { EventSourceConnection } from "./EventSourceConnection";

import { WaveModel } from "./wave-model";
import { Options } from './echo-broadcaster/wave-connector';

export class Wave {
    protected connection: EventSourceConnection;

    private models: Record<string, WaveModel> = {};

    private options: Options = {
        endpoint: '/wave',
        withCredentials: false,
        auth: {
            headers: {},
        },
        authEndpoint: '/broadcasting/auth',
        csrfToken: null,
        bearerToken: null,
        namespace: 'App.Models',
    }

    constructor(options?: Options) {
        this.options = { ...this.options, ...options };
        this.connection = new EventSourceConnection();
        this.connection.create(this.options.endpoint, this.options.withCredentials);
    }

    public model(model: string, key: string) {
        const index = `${model}.${String(key)}`;

        if (!this.models[index]) {
            this.models[index] = new WaveModel(model, key, this.connection, this.options);
        }

        return this.models[index];
    }
}
