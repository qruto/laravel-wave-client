import { EventSourceConnection } from "./EventSourceConnection";

import { WaveModel } from "./wave-model";

export class Wave {
    protected connection: EventSourceConnection;

    private models: Record<string, WaveModel> = {};

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
}
