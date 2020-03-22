namespace Secretarium {

    export interface KeyBase {
        name: string;
        version: number;
    }
    export interface ExportedKey extends KeyBase {
        publicKey: JsonWebKey;
        privateKey: JsonWebKey;
    }
    export interface ExportedKeyEncrypted extends KeyBase {
        iv: string;
        salt: string;
        data: string;
    }

    export class Key implements KeyBase {

        name: string = "";
        version: number = 0;
        cryptoKey: CryptoKeyPair = null;
        publicKeyRaw: Uint8Array = null;

        save: boolean = false;
        imported: boolean = false;
        encrypted: boolean = false;
        isNew: boolean = false;

        exportableKey: ExportedKey = null;
        exportUrl: string = "";
        exportableKeyEncrypted: ExportedKeyEncrypted = null;
        exportUrlEncrypted: string = "";

        async setCryptoKey(publicKey: CryptoKey, privateKey: CryptoKey) {
            this.cryptoKey = { publicKey: publicKey, privateKey: privateKey };
            this.publicKeyRaw = new Uint8Array(await window.crypto.subtle.exportKey("raw", publicKey)).subarray(1);
        }
        async setCryptoKeyFromJwk(publicKey: JsonWebKey, privateKey: JsonWebKey) {
            this.setCryptoKey(
                await window.crypto.subtle.importKey("jwk", publicKey, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]),
                await window.crypto.subtle.importKey("jwk", privateKey, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]));
        }

        async encrypt(pwd: string): Promise<Key> {
            if (!this.cryptoKey) throw "Key is encrypted";

            const salt = Secretarium.Utils.getRandomBytes(32),
                iv = Secretarium.Utils.getRandomBytes(12),
                weakPwd = Secretarium.Utils.encode(pwd),
                strongPwd = await Secretarium.Utils.hash(Secretarium.Utils.concatBytes(salt, weakPwd)),
                key = await window.crypto.subtle.importKey("raw", strongPwd, "AES-GCM", false, ["encrypt", "decrypt"]),
                json = JSON.stringify({ publicKey: this.exportableKey.publicKey, privateKey: this.exportableKey.privateKey }),
                data = Secretarium.Utils.encode(json),
                encrypted = new Uint8Array(await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv, tagLength: 128 }, key, data));
            this.version = 1;
            this.exportableKeyEncrypted = {
                name: this.name, version: this.version, iv: Secretarium.Utils.toBase64(iv),
                salt: Secretarium.Utils.toBase64(salt), data: Secretarium.Utils.toBase64(encrypted)
            };
            return this;
        }

        async decrypt(pwd: string): Promise<Key> {
            if (this.cryptoKey) return this;
            if (!this.exportableKeyEncrypted) throw "Key has not been imported";

            let iv = Secretarium.Utils.toBytes(this.exportableKeyEncrypted.iv, true),
                salt = Secretarium.Utils.toBytes(this.exportableKeyEncrypted.salt, true),
                encrypted = Secretarium.Utils.toBytes(this.exportableKeyEncrypted.data, true),
                weakpwd = Secretarium.Utils.encode(pwd),
                strongPwd = await Secretarium.Utils.hash(Secretarium.Utils.concatBytes(salt, weakpwd)),
                key = await window.crypto.subtle.importKey("raw", strongPwd, "AES-GCM", false, ["encrypt", "decrypt"]),
                decrypted : Uint8Array;
            try {
                decrypted = new Uint8Array(await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv, tagLength: 128 }, key, encrypted));
            }
            catch (e) {
                throw "Can't decrypt/invalid password";
            }

            try {
                if (this.version == 0) { // retro compat
                    const publicKey = await window.crypto.subtle.importKey("raw", decrypted.subarray(0, 65), { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]);
                    const privateKey = await window.crypto.subtle.importKey("pkcs8", decrypted.subarray(65), { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
                    await this.setCryptoKey(publicKey, privateKey);
                    this.exportableKey = {
                        name: this.name, version: 1,
                        publicKey: await window.crypto.subtle.exportKey("jwk", publicKey),
                        privateKey: await window.crypto.subtle.exportKey("jwk", privateKey)
                    };
                    await this.encrypt(pwd); // re-encrypt will migrate the encrypted exportable to the latest version
                }
                else {
                    const d = JSON.parse(Secretarium.Utils.decode(decrypted));
                    await this.setCryptoKeyFromJwk(d.publicKey, d.privateKey);
                    this.exportableKey = { name: this.name, version: 1, publicKey: d.publicKey, privateKey: d.privateKey };
                }

            }
            catch (e) {
                throw "Key format is incorrect";
            }

            return this;
        }

        getPublicKeyHex(delimiter: string = ''): string {
            if (!this.publicKeyRaw) throw "Key is encrypted";
            return Secretarium.Utils.toHex(this.publicKeyRaw, delimiter);
        }
    }

    export class KeysManager {

        keys: Array<Key> = [];

        constructor() {
            this.init();
        }

        private addKey(key: Key) {
            // unusual logic for reactivity
            let index = this.keys.findIndex(k => k.name == key.name);
            if (index < 0) this.keys.push(key);
            else this.keys.splice(index, 1, key);
            return key;
        }

        private init() {
            window.addEventListener('message', e => {
                if (e.origin !== "https://secretarium.com") return;

                const keys = JSON.parse(e.data);
                for (var lsKey of keys) {
                    if(lsKey.encryptedKeys) { // retro-compat
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

            const f = document.createElement("iframe");
            f.setAttribute("src", "https://secretarium.com/user-keys/");
            f.setAttribute("id", "secretarium-com-local-storage");
            f.style.display = "none";
            f.onload = () => {
                f.contentWindow.postMessage({ type: "get" }, "https://secretarium.com");
            };
            document.body.appendChild(f);
        }

        private static createObjectURL(o: Object): string {
            const j = JSON.stringify(o, null, 4);
            const b = new Blob([j], { type: 'application/json;charset=utf-8;' });
            return URL.createObjectURL(b);
        }

        async createKey(name: string): Promise<Key> {
            if (name.length == 0) throw "Invalid key name";

            const cryptoKey = await window.crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);

            const key = new Key();
            key.name = name;
            key.version = 1;
            key.isNew = true;
            key.setCryptoKey(cryptoKey.publicKey, cryptoKey.privateKey);
            key.exportableKey = {
                name: name, version: 1,
                publicKey: await window.crypto.subtle.exportKey("jwk", cryptoKey.publicKey),
                privateKey: await window.crypto.subtle.exportKey("jwk", cryptoKey.privateKey)
            };
            key.exportUrl = KeysManager.createObjectURL(key.exportableKey);

            return this.addKey(key);
        }

        importKeyFile(evt: any): Promise<Key> {
            return new Promise((resolve, reject) => {
                let e = evt.dataTransfer || evt.target; // dragged or browsed
                if (!e || !e.files) reject("Unsupported, missing key file");
                if (e.files.length != 1) reject("Unsupported, expecting a single key file");

                let reader = new FileReader();
                reader.onloadend = async () => {
                    try {
                        let k = JSON.parse(reader.result as string);
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
                        resolve(key);
                    }
                    catch (e) { reject(e.message); }
                };
                reader.onerror = e => { reject("Failed to load the key file"); };
                reader.readAsText(e.files[0]);
            });
        }

        removeKey(name: string): void {
            let index = this.keys.findIndex(k => k.name == name);
            if (index < 0) return;
            if (this.keys[index].exportUrl) URL.revokeObjectURL(this.keys[index].exportUrl);
            this.keys.splice(index, 1); // for reactivity purposes
            this.save();
        }

        save(): void {
            const toSave = this.keys.filter(k => k.save).map(key => key.exportableKeyEncrypted || key.exportableKey);
            const secretariumComFrame = document.getElementById("secretarium-com-local-storage") as HTMLIFrameElement;
            secretariumComFrame.contentWindow.postMessage({ type: "set", data: toSave }, "https://secretarium.com");
        }
    }
}