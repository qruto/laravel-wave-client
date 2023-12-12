import { prepare, fireEvent } from "./utils";
import Echo from "laravel-echo";
import { WaveConnector } from "../src/echo-broadcaster/wave-connector";
import { EventFormatter } from "laravel-echo";

import { mockEventSource } from './sse-mock';

mockEventSource();

const eventFormatter = new EventFormatter('App.Events');

let echo = null;
afterEach(() => {
    echo = null;
});
beforeEach(async () => {
    echo = new Echo({
        broadcaster: WaveConnector
    });

    await fireEvent('general.connected', 'some-random-key');
})

test('echo public event', async () => {
    const result = await prepare(
        (resolve) => {
            echo.channel('public')
                .listen('SomeEvent', function (data) {
                    resolve(data);
                });
        },
        () => fireEvent('public.'+eventFormatter.format('SomeEvent'), { foo: 'bar' })
    )

    expect(result).toEqual({ foo: 'bar' });
});
test('echo private event', async () => {
    const result = await prepare(
        (resolve) => {
            echo.private('chat')
                .listen('NewMessage', function (data) {
                    resolve(data);
                });
        },
        () => {
            return fireEvent('private-chat.' + eventFormatter.format('NewMessage'), { text: 'foo' });
        }
    );

    expect(result).toEqual({ text: 'foo' });
});

test('echo presence event', async () => {
    const result = await prepare(
        (resolve) => {
            echo.join('chat')
                .listen('NewMessage', function (data) {
                    resolve(data);
                });
        },
        () => fireEvent('presence-chat.'+eventFormatter.format('NewMessage'), { text: 'foo' })
    );

    expect(result).toEqual({ text: 'foo' });
});

test('echo presence here event', async () => {
    const result = await prepare((resolve) => {
        echo.join('chat')
            .here(function (users) {
               resolve(users);
            });
    });

    expect(result).toEqual(['rick', 'morty']);
});

test('echo presence join event', async () => {
    const result = await prepare(
        (resolve) => {
            echo.join('chat')
                .joining(function (user) {
                    resolve(user);
                });
        },
        () => fireEvent('presence-chat.join', { name: 'john' })
    );

    expect(result).toEqual({ name: 'john'});
});

test('echo presence leave event', async () => {
    const result = await prepare(
        (resolve) => {
            echo.join('chat')
                .leaving(function (user) {
                    resolve(user);
                });
        },
        () => fireEvent('presence-chat.leave', { name: 'john' })
    );

    expect(result).toEqual({ name: 'john'});
});

test('echo presence channel unsubscribe', async () => {
    const listener = jest.fn();

    await prepare(
        (resolve) => {
            echo.join('chat').listen('NewMessage', () => resolve(listener()));
            echo.join('chat').unsubscribe();
        },
        async (resolve) => {
            Promise.resolve().then(async () => {
                await fireEvent('presence-chat.' + eventFormatter.format('NewMessage'), { text: 'foo' });
            });

            resolve(null);
        }
    );

    // Make sure to wait a bit to ensure unsubscribe effect.
    expect(listener).not.toHaveBeenCalled();
});
