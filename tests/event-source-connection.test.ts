import { EventSourceConnection } from '../src/EventSourceConnection';

import { prepare, fireEvent } from './utils';

import { closeStream, mockEventSource } from './sse-mock';
mockEventSource();

test('create event source connection', async () => {
  const connectionId = await prepare(
      (resolve) => {
        (new EventSourceConnection('/wave')).afterConnect((id: string) => resolve(id));
      },
      () => fireEvent('connected', 'some-random-key')
  );

  expect(connectionId).toBe('some-random-key');
});

test('channel subscription', async () => {
  const data = { foo: 'bar' };

  const result = await prepare(
      (resolve) => {
        (new EventSourceConnection('/wave')).subscribe('some-event', message => resolve(message));
      },
      () => fireEvent('some-event', data)
  );

  expect(result).toEqual(data);
});

test('some-event unsubscribe', async () => {
  const listener = jest.fn();

  await prepare(
      (resolve) => {
          const connection = new EventSourceConnection('/wave', {}, { reconnect: false});

          connection.subscribe('some-event', () => resolve(listener()));
          connection.unsubscribe('some-event');
          connection.getSourcePromise().then(() => resolve(null))
      },
      async () => {
        await fireEvent('some-event', { foo: 'bar' });
        await closeStream();
      }
  );

  expect(listener).not.toHaveBeenCalled();
});

test('some-event remove listener', async () => {
  const listener = jest.fn();

  await prepare(
      (resolve) => {
        const callback = () => {
          resolve(listener());
        };

        const connection = new EventSourceConnection('/wave', {}, { reconnect: false});

        connection.subscribe('some-event', callback);
        connection.removeListener('some-event', callback);
        connection.getSourcePromise().then(() => {
            resolve(null);
        });
      },
      async () => {
        await fireEvent('some-event', { foo: 'bar' });
        await closeStream();
      }
  );

  expect(listener).not.toHaveBeenCalled();
});
