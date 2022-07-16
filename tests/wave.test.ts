import { mockEventSource, fireEvent, sendNotification } from "./utils";
import { Wave } from "../src/wave";

mockEventSource();

let wave: Wave;

beforeEach(() => {
    wave = new Wave();
})

beforeAll(() => {
    const headers = new Map();
    headers.set('content-type', 'application/json');

    global.fetch = jest.fn().mockImplementation(() => Promise.resolve({
        headers,
        json: () => Promise.resolve(['user1', 'user2']),
    }));

    Object.defineProperty(global, 'window', {
        writable: true,
        value: {
            'addEventListener': jest.fn().mockImplementation(event => event),
        }
    });

    Object.defineProperty(global, 'document', {
        writable: true,
        value: {
            'cookie': 'XSRF-TOKEN=some-random-token',
        }
    });
})

test('notification listener', (done) => {
    expect.assertions(1);

    wave.model('User', '1')
        .notification('App\\Notifications\\NewMessage', function (data) {
            expect(data).toMatchObject({ text: 'foo' });
        });

    sendNotification('App.Models.User.1', 'App\\Notifications\\NewMessage', { text: 'foo' });

    postponeDone(done);
});

test('several notification listeners', (done) => {
    expect.assertions(2);

    wave.model('User', '1')
        .notification('App\\Notifications\\NewMessage', function (data) {
            expect(data).toMatchObject({ text: 'foo' });
        });

    wave.model('User', '1')
        .notification('App\\Notifications\\NewMessage', function (data) {
            expect(data).toMatchObject({ text: 'foo' });
        });

    sendNotification('App.Models.User.1', 'App\\Notifications\\NewMessage', { text: 'foo' });

    postponeDone(done);
});

test('remove notification listener', (done) => {
    expect.assertions(1);

    const listener = jest.fn();

    wave.model('User', '1')
        .notification('App\\Notifications\\NewMessage', listener);

    wave.model('User', '1').stopListeningNotification('App\\Notifications\\NewMessage', listener);

    sendNotification('App.Models.User.1', 'App\\Notifications\\NewMessage', { text: 'foo' });

    postponeDone(done, () => expect(listener).not.toHaveBeenCalled());
});

test('model updated event', (done) => {
    expect.assertions(1);

    wave.model('User', '1')
        .updated(function (model) {
            expect(model).toEqual({ name: 'John' });
        });


    fireEvent('private-App.Models.User.1.UserUpdated', { model: { name: 'John' } });

    postponeDone(done);
});

test('different model updated event on same model', (done) => {
    expect.assertions(2);

    wave.model('User', '1')
        .updated(function (model) {
            expect(model).toEqual({ name: 'John' });
        }).updated('Team', function (model) {
            expect(model).toEqual({ name: 'John' });
        });

    fireEvent('private-App.Models.User.1.UserUpdated', { model: { name: 'John' } });
    fireEvent('private-App.Models.User.1.TeamUpdated', { model: { name: 'John' } });

    postponeDone(done);
});

test('several listeners', (done) => {
    expect.assertions(2);

    wave.model('User', '1')
        .updated(function (model) {
            expect(model).toEqual({ name: 'John' });
        })

    wave.model('User', '1')
        .updated(function (model) {
            expect(model).toEqual({ name: 'John' });
        });

    fireEvent('private-App.Models.User.1.UserUpdated', { model: { name: 'John' } });

    postponeDone(done);
});

test('remove listener', (done) => {
    expect.assertions(3);

    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const listener3 = jest.fn();

    wave.model('User', '1')
        .updated(listener1);

    wave.model('User', '1')
        .updated(listener2)
        .updated('Team', listener3);

    wave.model('User', '1')
        .stopListening('updated', listener1)
        .stopListening('Team', 'updated', listener3);

    fireEvent('private-App.Models.User.1.UserUpdated', { model: { name: 'John' } });
    fireEvent('private-App.Models.User.1.TeamUpdated', { model: { name: 'John' } });

    postponeDone(done, () => {
        expect(listener1).not.toBeCalled();
        expect(listener2).toBeCalled();
        expect(listener3).not.toBeCalled();
    });
});

function postponeDone(done: Function, callback?: Function) {
   setTimeout(() => {
        if (callback) {
            callback();
        }

        done();
    }, 10);
}
