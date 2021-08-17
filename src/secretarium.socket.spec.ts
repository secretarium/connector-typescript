import WebSocket from './secretarium.socket';

describe('Connector Socket', () => {
    it('Provides a socket', async () => {

        expect(WebSocket).toBeDefined();
        expect(() => new WebSocket('localhost')).toThrow();

        const socket = new WebSocket('wss://localhost');
        expect(socket).toBeDefined();
    });
});
