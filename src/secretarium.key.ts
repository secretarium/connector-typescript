import * as Utils from './secretarium.utils';
import { ErrorMessage, ErrorCodes } from './secretarium.constant';
import crypto from './msrcrypto';

export interface ExportedKey {
    publicKey: JsonWebKey; // need to use raw (pkcs8) as soon as firefox fixes bug 1133698
    privateKey: JsonWebKey; // need to use raw (pkcs8) as soon as firefox fixes bug 1133698
    version: number;
}
export interface KeyEncrypted {
    iv: string;
    salt: string;
    data: string;
    version:number;
}

export class Key {

    cryptoKey?: CryptoKeyPair;
    publicKeyRaw?: Uint8Array;
    exportableKey?: ExportedKey;

    async setCryptoKey(publicKey: CryptoKey, privateKey: CryptoKey): Promise<void> {
        this.cryptoKey = { publicKey: publicKey, privateKey: privateKey };
        this.publicKeyRaw = new Uint8Array(await crypto.subtle?.exportKey('raw', publicKey)).subarray(1);
    }
    async setCryptoKeyFromJwk(publicKey: JsonWebKey, privateKey: JsonWebKey): Promise<void> {
        this.setCryptoKey(
            await crypto.subtle?.importKey('jwk', publicKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']),
            await crypto.subtle?.importKey('jwk', privateKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']));
    }

    getPublicKeyHex(delimiter = ''): string {
        if (!this.publicKeyRaw) throw new Error(ErrorMessage[ErrorCodes.EKEYISENC]);
        return Utils.toHex(this.publicKeyRaw, delimiter);
    }

    async seal(pwd: string): Promise<KeyEncrypted> {
        if (!this.cryptoKey) throw new Error(ErrorMessage[ErrorCodes.EKEYISENC]);

        const salt = Utils.getRandomBytes(32),
            iv = Utils.getRandomBytes(12),
            weakPwd = Utils.encode(pwd),
            strongPwd = await Utils.hash(Utils.concatBytes(salt, weakPwd)),
            key = await crypto.subtle?.importKey('raw', strongPwd, 'AES-GCM', false, ['encrypt', 'decrypt']),
            json = JSON.stringify({ publicKey: this.exportableKey?.publicKey, privateKey: this.exportableKey?.privateKey }),
            data = Utils.encode(json),
            encrypted = new Uint8Array(await crypto.subtle?.encrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, key, data)),
            encryptedKey = { version: 1, iv: Utils.toBase64(iv), salt: Utils.toBase64(salt), data: Utils.toBase64(encrypted)};
        return encryptedKey;
    }

    static async createKey(): Promise<Key> {
        const cryptoKey = await crypto.subtle?.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
        const key = new Key();
        await key.setCryptoKey(cryptoKey.publicKey, cryptoKey.privateKey);
        key.exportableKey = { version: 1,
            publicKey: await crypto.subtle?.exportKey('jwk', cryptoKey.publicKey),
            privateKey: await crypto.subtle?.exportKey('jwk', cryptoKey.privateKey)
        };
        return key;
    }

    static async importKey(exported: ExportedKey): Promise<Key> {
        const key = new Key();
        key.exportableKey = exported;
        await key.setCryptoKeyFromJwk(key.exportableKey.publicKey, key.exportableKey.privateKey);
        return key;
    }

    static async importKeyEncrypted(encryptedKey: KeyEncrypted, pwd: string): Promise<Key> {
        const iv = Utils.fromBase64(encryptedKey.iv),
            salt = Utils.fromBase64(encryptedKey.salt),
            encrypted = Utils.fromBase64(encryptedKey.data),
            weakpwd = Utils.encode(pwd),
            strongPwd = await Utils.hash(Utils.concatBytes(salt, weakpwd)),
            aesKey = await crypto.subtle?.importKey('raw', strongPwd, 'AES-GCM', false, ['encrypt', 'decrypt']);
        let decrypted: Uint8Array;
        try {
            decrypted = new Uint8Array(await crypto.subtle?.decrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, aesKey, encrypted));
        }
        catch (e) {
            throw new Error(ErrorMessage[ErrorCodes.EINPASSWD]);
        }

        const key = new Key();
        try {
            if (encryptedKey.version === 0) { // retro compat
                const publicKey = await crypto.subtle?.importKey('raw', decrypted.subarray(0, 65), { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
                const privateKey = await crypto.subtle?.importKey('pkcs8', decrypted.subarray(65), { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
                await key.setCryptoKey(publicKey, privateKey);
                key.exportableKey = {
                    version: 1,
                    publicKey: await crypto.subtle?.exportKey('jwk', publicKey),
                    privateKey: await crypto.subtle?.exportKey('jwk', privateKey)
                };
            }
            else { // version 1
                const d = JSON.parse(Utils.decode(decrypted));
                await key.setCryptoKeyFromJwk(d.publicKey, d.privateKey);
                key.exportableKey = { version: 1, publicKey: d.publicKey, privateKey: d.privateKey };
            }

        }
        catch (e) {
            throw new Error(ErrorMessage[ErrorCodes.EINVKFORM]);
        }

        return key;
    }
}