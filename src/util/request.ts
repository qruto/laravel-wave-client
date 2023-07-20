import { EventSourceConnection } from "../EventSourceConnection";
import { Options } from '../echo-broadcaster/wave-connector';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export function prepareHeaders(options?: Options) {
    let csrfToken =  '';

    const authHeaders = options?.auth?.headers ?? {};
    const requestHeaders = options?.request?.headers ?? {};

    if (typeof document !== 'undefined' && typeof authHeaders['X-CSRF-TOKEN'] === 'undefined') {
        const match = document.cookie.match(new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'));
        csrfToken = match ? decodeURIComponent(match[3]) : null;
    }

    const csrfTokenHeader = csrfToken && typeof authHeaders['X-CSRF-TOKEN'] === 'undefined' ?
        {'X-XSRF-TOKEN': csrfToken} : {}

    let formattedHeaders: Record<string, string> = {};

    if (typeof requestHeaders !== 'undefined') {
        if (requestHeaders instanceof Headers) {
            requestHeaders.forEach((value, key) => {
                formattedHeaders[key] = value;
            });
        } else if (Array.isArray(requestHeaders)) {
            formattedHeaders = Object.fromEntries(requestHeaders);
        } else {
            formattedHeaders = requestHeaders;
        }
    }

    return {
        ...authHeaders,
        ...csrfTokenHeader,
        ...formattedHeaders,
    }
}

function prepareRequest(
    connectionId: string,
    method: HTTPMethod,
    options: Options,
    data?: object,
    keepAlive = false
): RequestInit {

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Socket-Id': connectionId,
        ...prepareHeaders(options),
    };

    return {
        method,
        ...options.request,
        headers: headers,
        ...(typeof data === 'undefined' ? {} : {
            body: JSON.stringify(data)
        }),
        keepalive: keepAlive,
    };
}

export default function request(connection: EventSourceConnection, keepAlive = false) {
    function create(method: HTTPMethod, route: string, options: Options, data?: object): Promise<Response> {
        const fetchRequest = (connectionId) => window.fetch(
            route,
            prepareRequest(connectionId, method, options, data, keepAlive)
        );

        return typeof connection.getId() === 'undefined'
            ? new Promise((resolve) => connection.once('connected', id => resolve(fetchRequest(id))))
            : fetchRequest(connection.getId());
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
