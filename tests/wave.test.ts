import { prepare, fireEvent, sendNotification } from "./utils";
import { Wave } from "../src/wave";

import { mockEventSource } from './sse-mock';
mockEventSource();

let wave: Wave;

beforeEach(async () => {
    wave = new Wave();

    await fireEvent('general.connected', 'some-random-key');
})

test('notification listener', async () => {
    const result = await prepare(
        (resolve) => {
            wave.model('User', '1')
                .notification('App\\Notifications\\NewMessage', function (data) {
                    resolve(data);
                });
        },
        () => sendNotification('App.Models.User.1', 'App\\Notifications\\NewMessage', { text: 'foo' })
    );

    expect(result).toMatchObject({ text: 'foo' });
});

test('several notification listeners', async () => {
    const listener = jest.fn();
    const listener2 = jest.fn();

    await prepare(
        () => {
            wave.model('User', '1')
                .notification('App\\Notifications\\NewMessage', listener);

            wave.model('User', '1')
                .notification('App\\Notifications\\NewMessage', listener2);
        },
        async (resolve) => {
            await sendNotification('App.Models.User.1', 'App\\Notifications\\NewMessage', { text: 'foo' });
            resolve(null);
        }
    );

    expect(listener).toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();
});

test('remove notification listener', async () => {
    const listener = jest.fn();

    await prepare(
        () => {
            wave.model('User', '1')
                .notification('App\\Notifications\\NewMessage', listener);
        },
        (resolve) => {
            wave.model('User', '1')
                .stopListeningNotification('App\\Notifications\\NewMessage', listener);
            sendNotification('App.Models.User.1', 'App\\Notifications\\NewMessage', { text: 'foo' });
            resolve(null);
        }
    );

    expect(listener).not.toHaveBeenCalled();
});

test('model updated event', async () => {
    const user = { name: 'John' };

    const result = await prepare(
        (resolve) => {
            wave.model('User', '1')
                .updated(function (model) {
                    resolve(model);
                });
        },
        () => fireEvent('private-App.Models.User.1.UserUpdated', { model: user })
    );

    expect(result).toEqual(user);
});

test('different model updated event on same model', async () => {
    const data = { user: null, team: null };

    await prepare(() => {
        wave.model('User', '1')
            .updated(function (model) {
                data.user = model;
            }).updated('Team', function (model) {
                data.team = model;
            });
        },
        async (resolve) => {
            await fireEvent('private-App.Models.User.1.UserUpdated', { model: { name: 'John' } });
            await fireEvent('private-App.Models.User.1.TeamUpdated', { model: { name: 'Personal' } });

            resolve(null);
        }
    );

    expect(data.user).toEqual({ name: 'John' });
    expect(data.team).toEqual({ name: 'Personal' });
});

test('several listeners', async () => {
    const listener = jest.fn();

    await prepare(
        () => {
            wave.model('User', '1')
                .updated(listener);

            wave.model('User', '1')
                .updated(listener);
        },
        async (resolve) => {
            await fireEvent('private-App.Models.User.1.UserUpdated', { model: { name: 'John' } });
            resolve(null);
        }
    );

    expect(listener).toBeCalledTimes(2);
});

test('remove listener', async () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const listener3 = jest.fn();

    await prepare(
        () => {
            wave.model('User', '1')
                .updated(listener1);

            wave.model('User', '1')
                .updated(listener2)
                .updated('Team', listener3);
        },
        async (resolve) => {
            wave.model('User', '1')
                .stopListening('updated', listener1)
                .stopListening('Team', 'updated', listener3);

            await fireEvent('private-App.Models.User.1.UserUpdated', { model: { name: 'John' } });
            await fireEvent('private-App.Models.User.1.TeamUpdated', { model: { name: 'John' } });

            resolve(null);
        }
    );
});
