import request from "./util/request";

import { EventSourceConnection } from "./EventSourceConnection";
import { Options } from './echo-broadcaster/wave-connector';

export interface AuthRequest {
    after: (callback: Function) => AuthRequest;
    response: Promise<void>;
}

export class AuthRequestError extends Error {
    public response: Response;
    constructor(message: string, response: Response) {
        super(message);
        this.name = 'AuthRequestError';
        this.response = response;
    }
}

export function authRequest(channel: string, connection: EventSourceConnection, options: Options): AuthRequest {
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

    const response = request(connection)
        .post(options.authEndpoint, options, { channel_name: channel })
        .then((response) => {
            if (!response.ok) {
                throw new AuthRequestError(`Auth request to failed with status ${response.status}`, response);
            }

            authorized = true;

            afterAuthCallbacks.forEach((callback) => callback(response));

            afterAuthCallbacks = [];
        });

    return {
        after,
        response,
    }
}
