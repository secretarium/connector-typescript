import MockSocket from 'jest-websocket-mock';
import { Key } from './secretarium.key';
import { ConnectionState } from './secretarium.constant';
import { SCP } from './secretarium.connector';

describe('Connector SCP', () => {
    it('Creates produces an SCP', async () => {

        const connection = new SCP();
        expect(connection).toBeDefined();
        expect(connection.state).toBe(ConnectionState.closed);

        const query = connection.newQuery('test', 'test', 'test', 'test');
        expect(query).toBeDefined();

        const transaction = connection.newTx('test', 'test', 'test', 'test');
        expect(transaction).toBeDefined();

        const newKey = await Key.createKey();

        try { await connection.connect('ws://localhost:4321', newKey, ''); }
        catch (e) {
            expect(e).toContain('ECONNREFUSED');
        }

        const server = new MockSocket('ws://0.0.0.0:1234');
        // console.error(server);
        // const successfulAttempt = await connection.connect('ws://localhost:1234', newKey, '');
        // await server.connected;
        // expect(successfulAttempt).toBe('OK');

        server.close();
        MockSocket.clean();

        expect(connection.close()).toBe(connection);
    });
});
