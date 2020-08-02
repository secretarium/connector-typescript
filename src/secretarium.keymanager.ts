import * as Utils from './secretarium.utils';

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

    async setCryptoKey(publicKey: CryptoKey, privateKey: CryptoKey) {
        this.cryptoKey = { publicKey: publicKey, privateKey: privateKey };
        this.publicKeyRaw = new Uint8Array(await window.crypto.subtle.exportKey('raw', publicKey)).subarray(1);
    }
    async setCryptoKeyFromJwk(publicKey: JsonWebKey, privateKey: JsonWebKey) {
        this.setCryptoKey(
            await window.crypto.subtle.importKey('jwk', publicKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']),
            await window.crypto.subtle.importKey('jwk', privateKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']));
    }

    async encrypt(pwd: string): Promise<Key> {
        if (!this.cryptoKey) throw 'Key is encrypted';

        const salt = Utils.getRandomBytes(32),
            iv = Utils.getRandomBytes(12),
            weakPwd = Utils.encode(pwd),
            strongPwd = await Utils.hash(Utils.concatBytes(salt, weakPwd)),
            key = await window.crypto.subtle.importKey('raw', strongPwd, 'AES-GCM', false, ['encrypt', 'decrypt']),
            json = JSON.stringify({ publicKey: this.exportableKey.publicKey, privateKey: this.exportableKey.privateKey }),
            data = Utils.encode(json),
            encrypted = new Uint8Array(await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, key, data));
        this.version = 1;
        this.exportableKeyEncrypted = {
            name: this.name, version: this.version, iv: Utils.toBase64(iv),
            salt: Utils.toBase64(salt), data: Utils.toBase64(encrypted)
        };
        return this;
    }

    async decrypt(pwd: string): Promise<Key> {
        if (this.cryptoKey) return this;
        if (!this.exportableKeyEncrypted) throw 'Key has not been imported';

        const iv = Utils.toBytes(this.exportableKeyEncrypted.iv, true),
            salt = Utils.toBytes(this.exportableKeyEncrypted.salt, true),
            encrypted = Utils.toBytes(this.exportableKeyEncrypted.data, true),
            weakpwd = Utils.encode(pwd),
            strongPwd = await Utils.hash(Utils.concatBytes(salt, weakpwd)),
            key = await window.crypto.subtle.importKey('raw', strongPwd, 'AES-GCM', false, ['encrypt', 'decrypt']);
        let decrypted: Uint8Array;
        try {
            decrypted = new Uint8Array(await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, key, encrypted));
        }
        catch (e) {
            throw 'Can\'t decrypt/invalid password';
        }

        try {
            if (this.version == 0) { // retro compat
                const publicKey = await window.crypto.subtle.importKey('raw', decrypted.subarray(0, 65), { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
                const privateKey = await window.crypto.subtle.importKey('pkcs8', decrypted.subarray(65), { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
                await this.setCryptoKey(publicKey, privateKey);
                this.exportableKey = {
                    name: this.name, version: 1,
                    publicKey: await window.crypto.subtle.exportKey('jwk', publicKey),
                    privateKey: await window.crypto.subtle.exportKey('jwk', privateKey)
                };
                await this.encrypt(pwd); // re-encrypt will migrate the encrypted exportable to the latest version
            }
            else {
                const d = JSON.parse(Utils.decode(decrypted));
                await this.setCryptoKeyFromJwk(d.publicKey, d.privateKey);
                this.exportableKey = { name: this.name, version: 1, publicKey: d.publicKey, privateKey: d.privateKey };
            }

        }
        catch (e) {
            throw 'Key format is incorrect';
        }

        return this;
    }

    getPublicKeyHex(delimiter = ''): string {
        if (!this.publicKeyRaw) throw 'Key is encrypted';
        return Utils.toHex(this.publicKeyRaw, delimiter);
    }
}

export class KeysManager {

    keys: Array<Key> = [];

    constructor() {
        this.init();
    }

    private addKey(key: Key) {
        // unusual logic for reactivity
        const index = this.keys.findIndex(k => k.name == key.name);
        if (index < 0) this.keys.push(key);
        else this.keys.splice(index, 1, key);
        return key;
    }

    private init() {
        window.addEventListener('message', e => {
            if (e.origin !== 'https://secretarium.com') return;
            if (!e.data) return;

            const keys = JSON.parse(e.data);
            for (const lsKey of keys) {
                if (lsKey.encryptedKeys) { // retro-compat
                    lsKey.data = lsKey.encryptedKeys;
                }
                const key = new Key();
                key.name = lsKey.name;
                key.version = lsKey.version || 0;
                key.save = true;
                if (lsKey.publicKey) {
                    key.exportableKey = lsKey as ExportedKey;
                    key.exportUrl = KeysManager.createObjectURL(lsKey);
                    key.setCryptoKeyFromJwk(key.exportableKey.publicKey, key.exportableKey.privateKey);
                }
                else {
                    key.exportableKeyEncrypted = lsKey as ExportedKeyEncrypted;
                    key.exportUrlEncrypted = KeysManager.createObjectURL(lsKey);
                    key.encrypted = true;
                }
                this.addKey(key);
            }
        });

        const f = document.createElement('iframe');
        f.setAttribute('src', 'https://secretarium.com/user-keys/');
        f.setAttribute('id', 'secretarium-com-frame');
        f.style.display = 'none';
        f.onload = () => {
            f.contentWindow?.postMessage({ type: 'get' }, 'https://secretarium.com');
        };
        document.body.appendChild(f);
    }

    private static createObjectURL(o: Record<string, any>): string {
        const j = JSON.stringify(o, null, 4);
        const b = new Blob([j], { type: 'application/json;charset=utf-8;' });
        return URL.createObjectURL(b);
    }

    async createKey(name: string): Promise<Key> {
        if (name.length == 0) throw 'Invalid key name';

        const cryptoKey = await window.crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);

        const key = new Key();
        key.name = name;
        key.version = 1;
        key.isNew = true;
        key.setCryptoKey(cryptoKey.publicKey, cryptoKey.privateKey);
        key.exportableKey = {
            name: name, version: 1,
            publicKey: await window.crypto.subtle.exportKey('jwk', cryptoKey.publicKey),
            privateKey: await window.crypto.subtle.exportKey('jwk', cryptoKey.privateKey)
        };
        key.exportUrl = KeysManager.createObjectURL(key.exportableKey);

        return this.addKey(key);
    }

    importKeyFile(evt: any): Promise<Key> {
        return new Promise((resolve, reject) => {
            const e = evt.dataTransfer || evt.target; // dragged or browsed
            if (!e || !e.files) reject('Unsupported, missing key file');
            if (e.files.length != 1) reject('Unsupported, expecting a single key file');

            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const k = JSON.parse(reader.result as string);
                    const key = new Key();
                    key.name = k.name;
                    key.version = k.version || 0;
                    key.imported = true;
                    if (k.publicKey) {
                        key.exportableKey = k as ExportedKey;
                        key.exportUrl = KeysManager.createObjectURL(k);
                        await key.setCryptoKeyFromJwk(key.exportableKey.publicKey, key.exportableKey.privateKey);
                    }
                    else {
                        key.exportableKeyEncrypted = k as ExportedKeyEncrypted;
                        key.exportUrlEncrypted = KeysManager.createObjectURL(k);
                        key.encrypted = true;
                    }
                    resolve(this.addKey(key));
                }
                catch (e) { reject(e.message); }
            };
            reader.onerror = e => { reject('Failed to load the key file'); };
            reader.readAsText(e.files[0]);
        });
    }

    removeKey(key: Key): void {
        const f = document.getElementById('secretarium-com-frame') as HTMLIFrameElement;
        f?.contentWindow?.postMessage({ type: 'remove', key: { name: key.name, version: key.version } }, 'https://secretarium.com');
    }

    saveKey(key: Key): void {
        if (!key.exportableKeyEncrypted)
            throw 'cant save, key must be encrypted';
        const f = document.getElementById('secretarium-com-frame') as HTMLIFrameElement;
        f?.contentWindow?.postMessage({ type: 'add', key: key.exportableKeyEncrypted }, 'https://secretarium.com');
    }
}