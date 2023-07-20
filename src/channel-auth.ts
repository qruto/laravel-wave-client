import request from "./util/request";

import { EventSourceConnection } from "./EventSourceConnection";
import { Options } from './echo-broadcaster/wave-connector';

export class AuthRequestError extends Error {
    public response: Response;
    constructor(message: string, response: Response) {
        super(message);
        this.name = 'AuthRequestError';
        this.response = response;
    }
}

export function authRequest(channel: string, connection: EventSourceConnection, options: Options) {
    return request(connection)
        .post(options.authEndpoint, options, { channel_name: channel })
        .then((response) => {
            if (!response.ok) {
                throw new AuthRequestError(`Auth request to failed with status ${response.status}`, response);
            }

            return response;
        });
}
