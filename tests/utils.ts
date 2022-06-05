import { beforeAll } from '@jest/globals';
import { MockEvent, EventSource } from 'mocksse';

export function mockEventSource() {
    beforeAll(() => {
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
