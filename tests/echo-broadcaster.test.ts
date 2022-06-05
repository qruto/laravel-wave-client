import { mockEventSource, fireEvent } from "./utils";
import Echo from "laravel-echo";
import { WaveConnector } from "../src/echo-broadcaster/wave-connector";
import { EventFormatter } from "../src/echo/event-formatter";

mockEventSource();

const eventFormatter = new EventFormatter('App.Events');
function createEcho() {
    return new Echo({
        broadcaster: WaveConnector
    });
}

beforeAll(() => {
    const headers = new Map();
    headers.set('content-type', 'application/json');

    global.fetch = jest.fn(() => Promise.resolve({
        headers,
        json: () => Promise.resolve(),
    })) as jest.Mock;
})

test('echo public event', () => {
    const echo = createEcho();

    echo.channel('public')
        .listen('SomeEvent', function (data) {
            expect(data).toEqual({ foo: 'bar' });
        });

    fireEvent('public.'+eventFormatter.format('SomeEvent'), { foo: 'bar' });
});

test('echo private event', (done) => {
    const echo = createEcho();

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
    const echo = createEcho();

    echo.private('chat')
        .listen('NewMessage', function (data) {
            expect(data).toEqual({ text: 'foo' });
        });

    fireEvent('presence-chat.'+eventFormatter.format('NewMessage'), { text: 'foo' });

    setTimeout(() => {
        done();
    }, 100);
});
