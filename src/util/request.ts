import { EventSourceConnection } from "../EventSourceConnection";

export default function request(connection: EventSourceConnection) {
    function create(method: 'GET' | 'POST' | 'PUT' | 'DELETE', route: string, data?: object, options?: any): Promise<Response> {
        let csrfToken = null;
        if (typeof document !== 'undefined') {
            const match = document.cookie.match(new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'));
            csrfToken = match ? decodeURIComponent(match[3]) : null;
        }

        const tokenBearer = options.bearerToken ? {'Authorization': 'Bearer '+options.bearerToken} : {}
        const fetchRequest = (connectionId) => fetch(route, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Socket-Id': connectionId,
                'X-XSRF-TOKEN': csrfToken,
                ...options?.auth?.headers,
                ...tokenBearer
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

    const factory = (method: 'GET' | 'POST' | 'PUT' | 'DELETE') => (route: string, data?: object, options?: any) => create(method, route, data, options);

    return {
        get: factory('GET'),
        post: factory('POST'),
        put: factory('PUT'),
        delete: factory('DELETE'),
    }
}
