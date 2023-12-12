import { resolveEvent } from './utils';

type StreamChunk = ReadableStreamReadResult<Uint8Array>;
export const events: StreamChunk[] = [];
export let streamChunkResolve: ((result: StreamChunk) => void)|null = null;
export let eventResolve: () => void|null = null;

export function setStreamChunkResolve(resolve: (result: StreamChunk) => void) {
    streamChunkResolve = resolve;
}

export function setEventResolve(resolve: () => void) {
    eventResolve = resolve;
}

export async function closeStream() {
    await resolveEvent({ value: new Uint8Array(), done: true});

    clearEvents();
}

function clearEvents() {
    events.splice(0, events.length);
    streamChunkResolve = null;
    eventResolve = null;
}

export function mockEventSource() {
    beforeAll(() => {
        Object.defineProperty(global, 'document', {
            writable: true,
            value: {
                'addEventListener': jest.fn().mockImplementation(event => event),
                'removeEventListener': jest.fn().mockImplementation(event => event),
                'cookie': 'XSRF-TOKEN=some-random-token',
            }
        });

        const fetchMock = jest.fn().mockImplementation((url: string) => {
            if (url === '/broadcasting/auth') {
                return Promise.resolve({
                    ok: true,
                    headers: new Headers({ 'content-type': 'text/plain' }),
                    status: 200,
                });
            }

            if (url === '/wave/presence-channel-users') {
                return Promise.resolve({
                    ok: true,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    status: 200,
                    json: () => Promise.resolve({_token: null, users: ['rick', 'morty']}),
                });
            }

            return Promise.resolve({
                ok: true,
                headers: new Headers({ 'content-type': 'text/event-stream' }),
                status: 200,
                body: {
                    getReader: () => ({
                        read: () => {
                            // return prefilled events at first
                            if (events.length > 0) {
                                eventResolve();
                                setEventResolve(null);

                                return Promise.resolve(events.shift());
                            }

                            return new Promise(
                                resolve => setStreamChunkResolve(resolve)
                            );
                        },
                    })
                },
            });
        });

        Object.defineProperty(global, 'window', {
            writable: true,
            value: {
                'fetch': fetchMock,
                'clearTimeout': jest.fn(),
                'setTimeout': jest.fn(),
                'addEventListener': jest.fn().mockImplementation(event => event),
            }
        });
    });

    afterEach(async () => {
        if (eventResolve !== null || streamChunkResolve !== null) {
            await closeStream();
        }

        jest.clearAllMocks();
    });
}
