import { EventSourceMessage } from '@microsoft/fetch-event-source';

import { events, streamChunkResolve, setEventResolve, setStreamChunkResolve } from './sse-mock';

function formatEvent(event: EventSourceMessage) {
    let formattedEvent = `id: ${event.id}\nevent: ${event.event}\ndata: ${event.data}`;

    if (event.retry !== undefined) {
        formattedEvent += `\nretry: ${event.retry}`;
    }

    formattedEvent += '\n\n';

    const encoder = new TextEncoder();
    return encoder.encode(formattedEvent);
}

export function resolveEvent(event: ReadableStreamReadResult<Uint8Array>) {
    return new Promise<void>(resolve => {
        if (streamChunkResolve === null) {
            events.push(event);

            setEventResolve(resolve);

            return;
        }

        streamChunkResolve(event);

        setStreamChunkResolve(null);

        resolve();
    });
}

export function fireEvent(type: string, data: object|string, retry?: number) {
    const event: EventSourceMessage = {
        id: Math.random().toString(36).substring(2),
        event: type,
        data: typeof data === 'string' ? data : JSON.stringify(data),
        retry: retry,
    };

    return resolveEvent({ value: formatEvent(event), done: false });
}

export function sendNotification(model: string, type: string, data: object) {
    return fireEvent(`private-${model}.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated`, { type, ...data });
}

type PromiseResolver<T> = (resolve: (value: T | PromiseLike<T>) => void) => void;

export function prepare<T>(setupCallback: PromiseResolver<T>, afterConnectCallback?: PromiseResolver<T>) {
    return new Promise<T>((resolve) => {
        setupCallback(resolve);

        if (typeof afterConnectCallback === 'function') {
            // setImmediate(() => afterConnectCallback(resolve));
            Promise.resolve().then(() => afterConnectCallback(resolve));
            // afterConnectCallback(value => Promise.resolve(value).then(resolve));
        }
    });
}
