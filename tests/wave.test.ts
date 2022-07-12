import { mockEventSource, fireEvent, sendNotification } from "./utils";
import { Wave } from "../src/wave";

mockEventSource();

let wave: null | Wave = null;

afterEach(() => {
    wave = null;
});

beforeEach(() => {
    wave = new Wave();
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

test('notification listener', (done) => {
    expect.assertions(1);

    wave.model('App.Models.User.1')
        .notification('App\\Notifications\\NewMessage', function (data) {
            expect(data).toMatchObject({ text: 'foo' });
        });

    sendNotification('App.Models.User.1', 'App\\Notifications\\NewMessage', { text: 'foo' });

    setTimeout(() => {
        done();
    }, 100);
});

test('several notification listeners', (done) => {
    expect.assertions(2);

    wave.model('App.Models.User.1')
        .notification('App\\Notifications\\NewMessage', function (data) {
            expect(data).toMatchObject({ text: 'foo' });
        });

    wave.model('App.Models.User.1')
        .notification('App\\Notifications\\NewMessage', function (data) {
            expect(data).toMatchObject({ text: 'foo' });
        });

    sendNotification('App.Models.User.1', 'App\\Notifications\\NewMessage', { text: 'foo' });

    setTimeout(() => {
        done();
    }, 100);
});

test('remove notification listener', (done) => {
    expect.assertions(1);

    const listener = jest.fn();

    wave.model('App.Models.User.1')
        .notification('App\\Notifications\\NewMessage', listener);

    wave.model('App.Models.User.1').stopListeningNotification('App\\Notifications\\NewMessage', listener);

    sendNotification('App.Models.User.1', 'App\\Notifications\\NewMessage', { text: 'foo' });

    setTimeout(() => {
        expect(listener).not.toHaveBeenCalled();
        done();
    }, 100);
});

test('model updated event', (done) => {
    expect.assertions(1);

    wave.model('App.Models.User.1')
        .updated(function (model) {
            expect(model).toEqual({ name: 'John' });
        });


    fireEvent('private-App.Models.User.1.UserUpdated', { model: { name: 'John' } });

    setTimeout(() => {
        done();
    }, 100);
})
