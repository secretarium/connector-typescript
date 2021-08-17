import WebSocket from './secretarium.socket';

describe('Connector Socket', () => {
    it('Provides a socket', async () => {

        expect(WebSocket).toBeDefined();
        expect(() => new WebSocket('locahost')).toThrow();

        const socket = new WebSocket('wss://locahost');
        expect(socket).toBeDefined();
    });
});
