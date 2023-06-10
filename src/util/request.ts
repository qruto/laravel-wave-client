import { EventSourceConnection } from "../EventSourceConnection";
import { Options } from '../echo-broadcaster/wave-connector';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

function prepareRequest(
    connectionId: string,
    method: HTTPMethod,
    options: Options,
    data?: object,
    keepAlive = false
): RequestInit {
    let csrfToken =  '';

    if (typeof document !== 'undefined' && options.auth.headers['X-CSRF-TOKEN'] === undefined) {
        const match = document.cookie.match(new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'));
        csrfToken = match ? decodeURIComponent(match[3]) : null;
    }

    const csrfTokenHeader = csrfToken ? {'X-XSRF-TOKEN': csrfToken} : {}

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Socket-Id': connectionId,
        ...options.auth.headers,
        ...csrfTokenHeader,
    };

    return {
        method,
        headers: headers,
        body: JSON.stringify(data || {}),
        keepalive: keepAlive,
        ...options.request,
    };
}

export default function request(connection: EventSourceConnection, keepAlive = false) {
    function create(method: HTTPMethod, route: string, options: Options, data?: object): Promise<Response> {
        const fetchRequest = (connectionId) => window.fetch(
            route,
            prepareRequest(connectionId, method, options, data, keepAlive)
        );

        return typeof connection.getId() === 'undefined' ? new Promise((resolve) => {
            connection.afterConnect((connectionId) => {
                resolve(fetchRequest(connectionId));
            });
        }) : fetchRequest(connection.getId());
    }

    const factory =
        (method: 'GET' | 'POST' | 'PUT' | 'DELETE') =>
            (route: string, options: Options, data?: object) =>
                create(method, route, options, data);

    return {
        get: factory('GET'),
        post: factory('POST'),
        put: factory('PUT'),
        delete: factory('DELETE'),
    }
}
