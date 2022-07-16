import { beforeEach } from '@jest/globals';
import { MockEvent, EventSource } from 'mocksse';

export function mockEventSource() {
    beforeEach(() => {
        EventSource.prototype.removeEventListener = function (eventName: string | symbol, listener: (...args: any[]) => void) {
            return this.removeListener(eventName, listener);
        }
        global.EventSource = EventSource;

        new MockEvent({
            url: '/wave',
            responses: [
                { type: 'connected', data: 'some-random-key'},
            ]
        })
    });

    afterEach(() => {
        const mock = new MockEvent({
            url: '/wave',
            responses: [
                { type: 'ping', data: 'pong'},
            ]
        });

        mock.clear();
    })
}

export function sendNotification(model: string, type: string, data: object) {
    return fireEvent(`private-${model}.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated`, { type, ...data });
}

export function fireEvent(type: string, data: object, interval = 0) {
  return new MockEvent({
    url: '/wave',
    setInterval: interval,
    responses: [
      { type: type, data: JSON.stringify({ data })},
    ],
  });
}
