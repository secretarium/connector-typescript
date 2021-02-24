import { Key } from './secretarium.key';
import encV2Key from '../fixtures/enc.v2.json';
import envV1Key from '../fixtures/enc.v1.json';

describe('Connector key', () => {
    it('Creates a new key from static method', async () => {

        const newKeyPromise = Key.createKey();
        expect(newKeyPromise).toBeInstanceOf(Promise);

        const newKey = await newKeyPromise;
        expect(newKey).toBeInstanceOf(Key);

        const exportedKeyPair = await newKey.exportKey();
        expect(exportedKeyPair).toBeDefined();
        expect(exportedKeyPair.privateKey).toBeDefined();
        expect(exportedKeyPair.publicKey).toBeDefined();
    });

    it('Seals a key', async () => {

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

    it('Imports sealed key v1', async () => {

        try {
            const newKey = await Key.importEncryptedKeyPair(envV1Key, '1234');
            expect(newKey).toBeInstanceOf(Key);
        } catch (e) {
            console.error('msrcrypto does not support PKCS8');
        }
    });

    it('Imports sealed key v1 with wrong password', async () => {
        expect.assertions(1);
        return Key.importEncryptedKeyPair(envV1Key, 'HelloWorld').then(() => {
            return;
        }).catch((err) => {
            expect(err).toEqual(new Error('Can\'t decrypt, Invalid password'));
        });
    });

    it('Imports sealed key v2', async () => {

        const newKey = await Key.importEncryptedKeyPair(encV2Key, 'HelloWorld');
        expect(newKey).toBeInstanceOf(Key);
    });

    it('Imports sealed key v2 with wrong password', async () => {
        expect.assertions(1);
        return Key.importEncryptedKeyPair(encV2Key, '1234').then(() => {
            return;
        }).catch((err) => {
            expect(err).toEqual(new Error('Can\'t decrypt, Invalid password'));
        });
    });

    it('Reexports clear an imported sealed key v2', async () => {

        const newKey = await Key.importEncryptedKeyPair(encV2Key, 'HelloWorld');
        const exportedKeyPair = await newKey.exportKey();
        expect(exportedKeyPair).toBeDefined();
        expect(exportedKeyPair.privateKey).toBeDefined();
        expect(exportedKeyPair.publicKey).toBeDefined();
    });

    it('Reexports sealed an imported sealed key v2', async () => {

        const newKey = await Key.importEncryptedKeyPair(encV2Key, 'HelloWorld');
        const exportedEncryptedKeyPair = await newKey.exportEncryptedKey();
        expect(exportedEncryptedKeyPair).toBeDefined();
        expect(exportedEncryptedKeyPair.version).toBeDefined();
        expect(exportedEncryptedKeyPair.iv).toBeDefined();
        expect(exportedEncryptedKeyPair.salt).toBeDefined();
        expect(exportedEncryptedKeyPair.data).toBeDefined();
    });

    test('Key cycle generate import', async () => {

        const newKey = await Key.createKey();
        const clearKey = await newKey.exportKey();
        const newSeal = await newKey.seal('HelloWorld');
        const encKey = await newSeal.exportEncryptedKey();
        const nextKey = await Key.importEncryptedKeyPair(encKey, 'HelloWorld');
        const nextClearKey = await nextKey.exportKey();

        expect(nextClearKey).toEqual(clearKey);
    });

});
