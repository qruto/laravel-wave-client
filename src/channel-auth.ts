import request from "./util/request";

import { EventSourceConnection } from "./EventSourceConnection";

export interface AuthRequest {
    after: (callback: Function) => AuthRequest;
    response: Promise<void>;
}

export function authRequest(channel: string, connection: EventSourceConnection, options: any): AuthRequest {
    let authorized = false;
    let afterAuthCallbacks: Function[] = [];

    function after(callback: Function) {
        if (authorized) {
            callback();

            return;
        }

        afterAuthCallbacks.push(callback);

        return this;
    }

    const response = request(connection).post(options.authEndpoint, { channel_name: channel }, options).then((response) => {
        authorized = true;

        afterAuthCallbacks.forEach((callback) => callback(response));

        afterAuthCallbacks = [];
    });

    return {
        after,
        response,
    }
}
