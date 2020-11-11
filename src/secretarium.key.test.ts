import { Key } from './secretarium.key';
import encJWTKey from '../fixtures/enc.jwt.json';

test('Create a new key from static method', async () => {

    const newKeyPromise = Key.createKey();
    expect(newKeyPromise).toBeInstanceOf(Promise);

    const newKey = await newKeyPromise;
    expect(newKey).toBeInstanceOf(Key);
    expect(newKey.cryptoKey).toBeDefined();
    expect(newKey.exportableKey).toBeDefined();
    expect(newKey.exportableKey?.privateKey).toBeDefined();
    expect(newKey.exportableKey?.publicKey).toBeDefined();
});

test('Create a new key from constructor', async () => {

    const newKey = new Key();
    expect(newKey).toBeInstanceOf(Key);

    expect(newKey.cryptoKey).toBeUndefined();
    expect(newKey.exportableKey).toBeUndefined();
});

test('Seal a key', async () => {

    const newKey = await Key.createKey();
    const newSealPromise = newKey.seal('HelloWorld');
    expect(newSealPromise).toBeInstanceOf(Promise);

    const newSeal = await newSealPromise;
    expect(newSeal.version).toBeDefined();
    expect(newSeal.iv).toBeDefined();
    expect(newSeal.salt).toBeDefined();
    expect(newSeal.data).toBeDefined();
});

test('Import sealed key v2', async () => {

    const newKey = await Key.importKeyEncrypted(encJWTKey, 'HelloWorld');
    expect(newKey).toBeInstanceOf(Key);
    expect(newKey.cryptoKey).toBeDefined();
    expect(newKey.exportableKey).toBeDefined();
    expect(newKey.exportableKey?.privateKey).toBeDefined();
    expect(newKey.exportableKey?.publicKey).toBeDefined();
});

test('Import sealed key v2 with wrong password', async () => {
    expect.assertions(1);
    return Key.importKeyEncrypted(encJWTKey, '1234').then(() => {
        return;
    }).catch((err) => {
        expect(err).toEqual(new Error('Can\'t decrypt, Invalid password'));
    });
});