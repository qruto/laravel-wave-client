import { mockEventSource, fireEvent } from "./utils";
import Echo from "laravel-echo";
import { WaveConnector } from "../src/echo-broadcaster/wave-connector";
import { EventFormatter } from "../src/echo/event-formatter";

mockEventSource();

const eventFormatter = new EventFormatter('App.Events');

let echo = null;
afterEach(() => {
    echo = null;
});
beforeEach(() => {
    echo = new Echo({
        broadcaster: WaveConnector
    });
})

beforeAll(() => {
    const headers = new Map();
    headers.set('content-type', 'application/json');

    global.fetch = jest.fn(() => Promise.resolve({
        headers,
        json: () => Promise.resolve(['user1', 'user2']),
    })) as jest.Mock;

    Object.defineProperty(global, 'window', {
        writable: true,
        value: {
            'addEventListener': jest.fn().mockImplementation(event => event),
        }
    });
})

test('echo public event', (done) => {
    expect.assertions(1);

    echo.channel('public')
        .listen('SomeEvent', function (data) {
            expect(data).toEqual({ foo: 'bar' });
        });

    fireEvent('public.'+eventFormatter.format('SomeEvent'), { foo: 'bar' });

    setTimeout(() => {
        done();
    }, 100);
});

test('echo private event', (done) => {
    expect.assertions(1);

    echo.private('chat')
        .listen('NewMessage', function (data) {
            expect(data).toEqual({ text: 'foo' });
        });

    fireEvent('private-chat.'+eventFormatter.format('NewMessage'), { text: 'foo' });

    setTimeout(() => {
        done();
    }, 100);
});

test('echo presence event', (done) => {
    expect.assertions(1);

    echo.join('chat')
        .listen('NewMessage', function (data) {
            expect(data).toEqual({ text: 'foo' });
        });

    fireEvent('presence-chat.'+eventFormatter.format('NewMessage'), { text: 'foo' });

    setTimeout(() => {
        done();
    }, 100);
});

test('echo presence here event', (done) => {
    expect.assertions(1);

    echo.join('chat')
        .here(function (users) {
            expect(users).toEqual(['user1', 'user2']);
        });

    setTimeout(() => {
        done();
    }, 100);
});

test('echo presence here event', (done) => {
    expect.assertions(1);

    echo.join('chat')
        .joining(function (user) {
            expect(user).toEqual({ name: 'john'});
        });

    fireEvent('presence-chat.join', { name: 'john' });

    setTimeout(() => {
        done();
    }, 100);
});

test('echo presence leave event', (done) => {
    expect.assertions(1);

    echo.join('chat')
        .leaving(function (user) {
            expect(user).toEqual({ name: 'john'});
        });

    fireEvent('presence-chat.leave', { name: 'john' });

    setTimeout(() => {
        done();
    }, 100);
});

test('echo presence channel unsubscribe', (done) => {
    expect.assertions(1);
    const listener = jest.fn();

    echo.join('chat').listen('NewMessage', listener);

    echo.join('chat').unsubscribe();

    fireEvent('presence-chat.'+eventFormatter.format('NewMessage'), { text: 'foo' });

    setTimeout(() => {
        expect(listener).not.toHaveBeenCalled();
        done();
    }, 100);
});
