import * as Utils from './secretarium.utils';
import { ErrorMessage, ErrorCodes } from './secretarium.constant';

export interface KeyBase {
    name: string;
    version: number;
}
export interface ExportedKey extends KeyBase {
    publicKey: JsonWebKey; // need to use raw (pkcs8) as soon as firefox fixes bug 1133698
    privateKey: JsonWebKey; // need to use raw (pkcs8) as soon as firefox fixes bug 1133698
}
export interface ExportedKeyEncrypted extends KeyBase {
    iv: string;
    salt: string;
    data: string;
}

export class Key implements KeyBase {

    name = '';
    version = 0;
    cryptoKey: CryptoKeyPair | null = null;
    publicKeyRaw: Uint8Array | null = null;

    save = false;
    imported = false;
    encrypted = false;
    isNew = false;

    exportableKey: ExportedKey | null = null;
    exportUrl = '';
    exportableKeyEncrypted: ExportedKeyEncrypted | null = null;
    exportUrlEncrypted = '';

    async setCryptoKey(publicKey: CryptoKey, privateKey: CryptoKey): Promise<void> {
        this.cryptoKey = { publicKey: publicKey, privateKey: privateKey };
        this.publicKeyRaw = new Uint8Array(await window.crypto.subtle.exportKey('raw', publicKey)).subarray(1);
    }
    async setCryptoKeyFromJwk(publicKey: JsonWebKey, privateKey: JsonWebKey): Promise<void> {
        this.setCryptoKey(
            await window.crypto.subtle.importKey('jwk', publicKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']),
            await window.crypto.subtle.importKey('jwk', privateKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']));
    }

    getPublicKeyHex(delimiter = ''): string {
        if (!this.publicKeyRaw) throw new Error(ErrorMessage[ErrorCodes.EKEYISENC]);
        return Utils.toHex(this.publicKeyRaw, delimiter);
    }
}