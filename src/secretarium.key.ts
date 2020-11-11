import * as Utils from './secretarium.utils';
import { ErrorMessage, ErrorCodes } from './secretarium.constant';
import crypto from './msrcrypto';

const CURRENT_KEY_VERSION = 2;

export type ClearKeyPair = {
    publicKey: JsonWebKey; // need to use raw (pkcs8) as soon as firefox fixes bug 1133698
    privateKey: JsonWebKey; // need to use raw (pkcs8) as soon as firefox fixes bug 1133698
    version: number;
}

type EncryptedKeyPairV0 = {
    version: string;
    name?: string;
    iv: string;
    salt: string;
    encryptedKeys: string;
}

type EncryptedKeyPairV2 = {
    version: number;
    name?: string;
    iv: string;
    salt: string;
    data: string;
}

export type EncryptedKeyPair = EncryptedKeyPairV0 | EncryptedKeyPairV2;

export class Key {

    private cryptoKeyPair: CryptoKeyPair;
    private exportableKey?: ClearKeyPair;
    private exportableEncryptedKey?: EncryptedKeyPairV2;
    private rawPublicKey?: Uint8Array;
    private constructor(keyPair: CryptoKeyPair) {
        this.cryptoKeyPair = keyPair;
    }

    async seal(pwd: string): Promise<Key> {

        if (!this.cryptoKeyPair)
            throw new Error(ErrorMessage[ErrorCodes.EKEYISENC]);

        const salt = Utils.getRandomBytes(32);
        const iv = Utils.getRandomBytes(12);
        const weakPwd = Utils.encode(pwd);
        const strongPwd = await Utils.hash(Utils.concatBytes(salt, weakPwd));
        const key = await crypto.subtle?.importKey('raw', strongPwd, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
        const json = JSON.stringify({
            publicKey: this.cryptoKeyPair?.publicKey,
            privateKey: this.cryptoKeyPair?.privateKey
        });
        const data = Utils.encode(json);
        const encrypted = new Uint8Array(await crypto.subtle?.encrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, key, data));

        this.exportableEncryptedKey = {
            version: CURRENT_KEY_VERSION,
            iv: Utils.toBase64(iv),
            salt: Utils.toBase64(salt),
            data: Utils.toBase64(encrypted)
        };

        return this;
    }

    async exportKey(): Promise<ClearKeyPair> {
        if (!this.exportableKey)
            this.exportableKey = {
                version: CURRENT_KEY_VERSION,
                publicKey: await crypto.subtle?.exportKey('jwk', this.cryptoKeyPair.publicKey),
                privateKey: await crypto.subtle?.exportKey('jwk', this.cryptoKeyPair.privateKey)
            };
        return this.exportableKey;
    }

    async exportEncryptedKey(): Promise<EncryptedKeyPairV2> {
        if (!this.exportableEncryptedKey)
            throw new Error(ErrorMessage[ErrorCodes.EKEYNOTSL]);
        return this.exportableEncryptedKey;
    }

    async getRawPublicKey(): Promise<Uint8Array> {
        if (!this.rawPublicKey)
            this.rawPublicKey = new Uint8Array(await crypto.subtle?.exportKey('raw', this.cryptoKeyPair.publicKey)).subarray(1);
        return this.rawPublicKey;
    }

    async getRawPublicKeyHex(delimiter = ''): Promise<string> {
        return Utils.toHex(await this.getRawPublicKey(), delimiter);
    }

    static async createKey(): Promise<Key> {
        return new Key(await crypto.subtle?.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']));
    }

    static async importKey(exportableKey: ClearKeyPair): Promise<Key> {

        const publicKey = await crypto.subtle?.importKey('jwk', exportableKey.publicKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
        const privateKey = await crypto.subtle?.importKey('jwk', exportableKey.privateKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);

        return new Key({
            publicKey,
            privateKey
        });
    }

    static async importEncryptedKeyPair(inputEncryptedKeyPair: EncryptedKeyPair, pwd: string): Promise<Key> {

        const decryptV2 = async (inputKeyPair: Pick<EncryptedKeyPairV2, 'iv' | 'salt' | 'data'>) => {

            const iv = Utils.fromBase64(inputKeyPair.iv);
            const salt = Utils.fromBase64(inputKeyPair.salt);
            const encrypted = Utils.fromBase64(inputKeyPair.data);
            const weakpwd = Utils.encode(pwd);
            const strongPwd = await Utils.hash(Utils.concatBytes(salt, weakpwd));
            const aesKey = await crypto.subtle?.importKey('raw', strongPwd, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

            let decrypted: Uint8Array;
            try {
                decrypted = new Uint8Array(await crypto.subtle?.decrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, aesKey, encrypted));
            }
            catch (e) {
                throw new Error(ErrorMessage[ErrorCodes.EINPASSWD]);
            }

            return decrypted;
        };

        switch (parseInt(`${inputEncryptedKeyPair.version}`)) {
            case 0:
            case 1: {
                const encryptedKey = inputEncryptedKeyPair as EncryptedKeyPairV0;
                const decrypted = await decryptV2({
                    iv: encryptedKey.iv,
                    salt: encryptedKey.salt,
                    data: encryptedKey.encryptedKeys
                });

                const publicKey = await crypto.subtle?.importKey('raw', decrypted.subarray(0, 65), { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
                const privateKey = await crypto.subtle?.importKey('pkcs8', decrypted.subarray(65), { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);

                return new Key({
                    publicKey: await crypto.subtle?.exportKey('jwk', publicKey),
                    privateKey: await crypto.subtle?.exportKey('jwk', privateKey)
                });
            }
            case 2: {
                const encryptedKey = inputEncryptedKeyPair as EncryptedKeyPairV2;
                const decrypted = await decryptV2(encryptedKey);

                return new Key(JSON.parse(Utils.decode(decrypted)));
            }
            default:
                throw new Error(ErrorMessage[ErrorCodes.EINVKFORM]);
        }
    }
}