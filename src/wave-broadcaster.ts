import { EventSourceConnection } from "./EventSourceConnection";

import { WaveModel } from "./wave-model";

interface Options {
    endpoint: string;
    authEndpoint: string;
    namespace: string;
}

export class Wave {
    protected connection: EventSourceConnection;

    private models: Record<string, WaveModel> = {};

    private options: Options = {
        endpoint: '/wave',
        authEndpoint: '/broadcasting/auth',
        namespace: 'App.Models',
    }

    constructor(options?: Options) {
        this.options = { ...this.options, ...options };
        this.connection = new EventSourceConnection();
        this.connection.create(this.options.endpoint);
    }

    public model(model: string) {
        if (!this.models[model]) {
            const { authEndpoint, namespace } = this.options;
            this.models[model] = new WaveModel(model, this.connection, { authEndpoint, namespace });
        }

        return this.models[model];
    }
}
