import { EventSourceConnection } from "../EventSourceConnection";

export default function request(connection: EventSourceConnection) {
    function create(method: 'GET' | 'POST' | 'PUT' | 'DELETE', route: string, data?: object): Promise<Response> {
        const fetchRequest = (connectionId) => fetch(route, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Socket-Id': connectionId,
            },
            body: JSON.stringify(data || {}),
        }).then((response) => {
            return response.headers.get('content-type') === 'application/json' ? response.json() : response;
        });

        return connection.source.readyState !== EventSource.OPEN ? new Promise((resolve) => {
            connection.afterConnect((connectionId) => {
                resolve(fetchRequest(connectionId));
            });
        }) : fetchRequest(connection.getId());
    }

    const factory = (method: 'GET' | 'POST' | 'PUT' | 'DELETE') => (route: string, data?: object) => create(method, route, data);

    return {
        get: factory('GET'),
        post: factory('POST'),
        put: factory('PUT'),
        delete: factory('DELETE'),
    }
}
