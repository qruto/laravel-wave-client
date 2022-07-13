import { MockEvent } from 'mocksse';
import { EventSourceConnection } from '../src/EventSourceConnection';
import { expect, jest, test } from '@jest/globals';
import { mockEventSource, fireEvent } from './utils';

mockEventSource();

const connection = new EventSourceConnection();

test('create event source connection', () => {
  new MockEvent({
    url: '/wave',
    responses: [
      { type: 'connected', data: 'some-randmom-key'},
    ]
  })

  connection.afterConnect((connectionId) => expect(connectionId).toBe('some-randmom-key'));
  connection.create('/wave');
});

test('channel subscription', () => {
  fireEvent('channel', { foo: 'bar' });

  connection.create('/wave');

  connection.subscribe('some-event', (data) => expect(data).toEqual({ foo: 'bar' }));
});

test('some-event unsubsribe', (done) => {
  const listener = jest.fn();

  connection.create('/wave');

  connection.subscribe('some-event', listener);

  connection.unsubscribe('some-event');

  fireEvent('some-event', { foo: 'bar' });

  setTimeout(() => {
    expect(listener).not.toHaveBeenCalled();
    done();
  }, 100);
});

test('some-event remove listener', (done) => {
  const listener = jest.fn();

  connection.create('/wave');

  connection.subscribe('some-event', listener);

  connection.removeListener('some-event', listener);

  fireEvent('some-event', { foo: 'bar' });

  setTimeout(() => {
    expect(listener).not.toHaveBeenCalled();
    done();
  }, 100);
});
