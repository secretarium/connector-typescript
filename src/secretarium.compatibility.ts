namespace Secretarium {

    export class Compatibility {

        static localStorage(): boolean {
            try {
                window.localStorage.setItem("a", "a");
                window.localStorage.removeItem("a");
                return true;
            } catch (e) {
                return false;
            }
        }

        static async ellipticCrypto(): Promise<JsonWebKey | boolean> {
            try {
                const key = await window.crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
                /*pkcs8 is preferred but does not work on Firefox https://bugzilla.mozilla.org/show_bug.cgi?id=1133698*/
                return await window.crypto.subtle.exportKey("jwk", key.privateKey);
            } catch (e) {
                return false;
            }
        }

        static async encryptionAESGCM(): Promise<CryptoKey | boolean> {
            try {
                const pwd = new Uint8Array(32), iv = new Uint8Array(12);
                window.crypto.getRandomValues(pwd);
                window.crypto.getRandomValues(iv);
                return await window.crypto.subtle.importKey("raw", pwd, "AES-GCM", false, ["encrypt", "decrypt"]);
            } catch (e) {
                return false;
            }
        }

        static encoding(): boolean {
            return typeof (TextEncoder) != "undefined" && typeof (TextDecoder) != "undefined"
        }

        static desktopNotifications(): boolean {
            return false;
        }

        static webAuthn(): boolean {
            return false;
        }
    }

}