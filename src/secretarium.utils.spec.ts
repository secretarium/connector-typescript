import * as Utils from './secretarium.utils';

describe('Connector Utils', () => {
    it('Presents utils functionc', async () => {
        expect(Utils.concatBytes).toBeDefined();
        expect(Utils.concatBytesArrays).toBeDefined();
        expect(Utils.decode).toBeDefined();
        expect(Utils.encode).toBeDefined();
        expect(Utils.fromBase64).toBeDefined();
        expect(Utils.getRandomBytes).toBeDefined();
        expect(Utils.getRandomString).toBeDefined();
        expect(Utils.hash).toBeDefined();
        expect(Utils.hashBase64).toBeDefined();
        expect(Utils.incrementBy).toBeDefined();
        expect(Utils.sequenceEqual).toBeDefined();
        expect(Utils.toBase64).toBeDefined();
        expect(Utils.toHex).toBeDefined();
        expect(Utils.xor).toBeDefined();
    });

    it('Provides byte contact functions', async () => {

        expect(Utils.concatBytes(new Uint8Array([0x2a]), new Uint8Array([0x42]))).toEqual(new Uint8Array([0x2a, 0x42]));
        expect(Utils.concatBytesArrays([new Uint8Array([0x2a]), new Uint8Array([0x42])])).toEqual(new Uint8Array([0x2a, 0x42]));
    });

    it('Manipulate base64', async () => {

        expect(Utils.toBase64(new Uint8Array([0x1d, 0xe9, 0x65, 0xa3, 0xe5, 0xa8, 0xae, 0x57, 0x7f, 0xd8]))).toBe('Hello+World/2A==');
        expect(Utils.toBase64(new Uint8Array([0x1d, 0xe9, 0x65, 0xa3, 0xe5, 0xa8, 0xae, 0x57, 0x7f, 0xd8]), true)).toBe('Hello-World_2A==');

        const string = 'Hello, 42 ...';
        const token = Utils.encode(string);
        expect(Utils.decode(Utils.fromBase64(Utils.toBase64(token)))).toEqual(string);
        expect(Utils.decode(Utils.fromBase64(Utils.toBase64(token)))).toEqual(string);

    });

    it('Offer pseudo random functions', async () => {

        expect(Utils.getRandomBytes()).toBeInstanceOf(Uint8Array);
        expect(Utils.getRandomBytes(42).length).toBe(42);
        expect(Utils.getRandomString()).toBeDefined();
    });
});
