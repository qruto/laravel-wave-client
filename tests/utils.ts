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
                { type: 'connected', data: 'some-randmom-key'},
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

export function fireEvent(type: string, data: object, interval = 0) {
  new MockEvent({
    url: '/wave',
    setInterval: interval,
    responses: [
      { type: type, data: JSON.stringify({ data })},
    ],
  });
}
