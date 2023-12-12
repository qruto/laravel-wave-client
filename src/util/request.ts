import { EventSourceConnection } from "../EventSourceConnection";
import { Options } from '../echo-broadcaster/wave-connector';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export function getXsrfTokenFromCookie(): string {
    if (typeof document !== 'undefined') {
        const match = document.cookie.match(new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'));
        return match ? decodeURIComponent(match[3]) : null;
    }

    return '';
}

export function prepareHeaders(options?: Options) {
    const authHeaders = options?.auth?.headers ?? {};

    const csrfTokenHeader = {};

    if (options.csrfToken) {
        csrfTokenHeader['X-CSRF-TOKEN'] = options.csrfToken;
    } else if (typeof authHeaders['X-CSRF-TOKEN'] !== 'undefined') {
        csrfTokenHeader['X-CSRF-TOKEN'] = authHeaders['X-CSRF-TOKEN'];
    } else {
        const token = getXsrfTokenFromCookie();

        if (token) {
            csrfTokenHeader['X-XSRF-TOKEN'] = token;
        }
    }

    let formattedHeaders: Record<string, string> | Headers = {};

    const requestHeaders = options?.request?.headers ?? {};

    if (typeof requestHeaders !== 'undefined') {

        if (requestHeaders instanceof Headers) {
            (requestHeaders as Headers).forEach((value, key) => {
                formattedHeaders[key] = value;
            });
        } else if (Array.isArray(requestHeaders)) {
            formattedHeaders = Object.fromEntries(requestHeaders);
        } else {
            formattedHeaders = requestHeaders;
        }
    }

    return {
        ...options?.auth?.headers ?? {},
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
        ...(typeof data === 'undefined' || method === 'GET' ? {} : {
            body: JSON.stringify(data)
        }),
        keepalive: keepAlive,
    };
}

export default function request(connection: EventSourceConnection, keepAlive = false) {
    function create(method: HTTPMethod, route: string, options: Options, data?: object): Promise<Response> {
        let uri = route;

        if (method === 'GET' && typeof data !== 'undefined') {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(data)) {
                params.append(key, value as string);
            }

            uri += '?' + params.toString();
        }

        const fetchRequest = (connectionId) => window.fetch(
            uri,
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

export function beacon(connectionId: string, csrfToken: string, route: string, data?: object, method = 'POST'): void {
    navigator.sendBeacon(
        route,
        new Blob([JSON.stringify(Object.assign(data ?? {}, {
            socket_id: connectionId,
            _token: csrfToken,
            _method: method,
        }))], { type: 'application/json' })
    );
}
