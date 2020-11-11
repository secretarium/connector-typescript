import { Key } from './secretarium.key';
import encV2Key from '../fixtures/enc.v2.json';
import envV1Key from '../fixtures/enc.v1.json';

test('Create a new key from static method', async () => {

    const newKeyPromise = Key.createKey();
    expect(newKeyPromise).toBeInstanceOf(Promise);

    const newKey = await newKeyPromise;
    expect(newKey).toBeInstanceOf(Key);

    const exportedKeyPair = await newKey.exportKey();
    expect(exportedKeyPair).toBeDefined();
    expect(exportedKeyPair.privateKey).toBeDefined();
    expect(exportedKeyPair.publicKey).toBeDefined();
});

test('Seal a key', async () => {

    const newKey = await Key.createKey();
    const newSealPromise = newKey.seal('HelloWorld');
    expect(newSealPromise).toBeInstanceOf(Promise);

    const sealedKey = await newSealPromise;
    expect(sealedKey).toBeInstanceOf(Key);

    const encryptedKey = await sealedKey.exportEncryptedKey();
    expect(encryptedKey.version).toBeDefined();
    expect(encryptedKey.iv).toBeDefined();
    expect(encryptedKey.salt).toBeDefined();
    expect(encryptedKey.data).toBeDefined();
});

test('Import sealed key v1', async () => {

    try {
        const newKey = await Key.importEncryptedKeyPair(envV1Key, '1234');
        expect(newKey).toBeInstanceOf(Key);
    } catch (e) {
        console.error('msrcrypto does not support PKCS8');
    }
});

test('Import sealed key v1 with wrong password', async () => {
    expect.assertions(1);
    return Key.importEncryptedKeyPair(envV1Key, 'HelloWorld').then(() => {
        return;
    }).catch((err) => {
        expect(err).toEqual(new Error('Can\'t decrypt, Invalid password'));
    });
});

test('Import sealed key v2', async () => {

    const newKey = await Key.importEncryptedKeyPair(encV2Key, 'HelloWorld');
    expect(newKey).toBeInstanceOf(Key);
});

test('Import sealed key v2 with wrong password', async () => {
    expect.assertions(1);
    return Key.importEncryptedKeyPair(encV2Key, '1234').then(() => {
        return;
    }).catch((err) => {
        expect(err).toEqual(new Error('Can\'t decrypt, Invalid password'));
    });
});

test('Reexport an imported sealed key v2', async () => {

    const newKey = await Key.importEncryptedKeyPair(encV2Key, 'HelloWorld');
    const exportedKeyPair = await newKey.exportKey();
    expect(exportedKeyPair).toBeDefined();
    expect(exportedKeyPair.privateKey).toBeDefined();
    expect(exportedKeyPair.publicKey).toBeDefined();
});
