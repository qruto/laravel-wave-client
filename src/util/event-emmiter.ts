type Listener<T extends any[]> = (...args: T) => void;

export default class EventEmitter<EventMap extends Record<keyof EventMap, any[]>> {
    private listeners: Partial<Record<keyof EventMap, Listener<EventMap[keyof EventMap]>[]>> = {};

    once<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
        const onceListener: Listener<EventMap[K]> = (...args: EventMap[K]) => {
            listener(...args);

            this.off(event, onceListener);
        };

        this.on(event, onceListener);
    }

    on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }

        this.listeners[event]?.push(listener);
    }

    emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]): void {
        this.listeners[event]?.slice().forEach(listener => listener(...args));
    }

    off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
        const listeners = this.listeners[event];

        if (!listeners) return;

        const index = listeners.indexOf(listener);

        if (index > -1) {
            listeners.splice(index, 1);
        }
    }
}
