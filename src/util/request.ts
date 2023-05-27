import { EventSourceConnection } from "../EventSourceConnection";
import { Options } from '../echo-broadcaster/wave-connector';

export default function request(connection: EventSourceConnection) {
    function create(method: 'GET' | 'POST' | 'PUT' | 'DELETE', route: string, options: Options, data?: object): Promise<Response> {
        let csrfToken =  '';

        if (typeof document !== 'undefined' && options.auth.headers['X-CSRF-TOKEN'] === undefined) {
            const match = document.cookie.match(new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'));
            csrfToken = match ? decodeURIComponent(match[3]) : null;
        }

        const csrfTokenHeader = csrfToken ? {'X-XSRF-TOKEN': csrfToken} : {}

        const fetchRequest = (connectionId) => fetch(route, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Socket-Id': connectionId,
                ...options.auth.headers,
                ...csrfTokenHeader,
            },
            body: JSON.stringify(data || {}),
        }).then((response) => {
            return response.headers.get('content-type') === 'application/json' ? response.json() : response;
        });

        return typeof connection.getId() === 'undefined' ? new Promise((resolve) => {
            connection.afterConnect((connectionId) => {
                resolve(fetchRequest(connectionId));
            });
        }) : fetchRequest(connection.getId());
    }

    const factory = (method: 'GET' | 'POST' | 'PUT' | 'DELETE') => (route: string, options: Options, data?: object) => create(method, route, options, data);

    return {
        get: factory('GET'),
        post: factory('POST'),
        put: factory('PUT'),
        delete: factory('DELETE'),
    }
}
