const decoder = new TextDecoder('utf-8');
const encoder = new TextEncoder();

export function xor(a: Uint8Array, b: Uint8Array): Uint8Array {
    if (a.length != b.length)
        throw 'array should have the same size';
    return a.map((x, i) => x ^ b[i]);
}

export function incrementBy(src: Uint8Array, offset: Uint8Array): Uint8Array {
    const inc = Uint8Array.from(src), szDiff = src.length - offset.length;

    for (let j = offset.length - 1; j >= 0; j--) {
        for (let i = j + szDiff, o = offset[j]; i >= 0; i--) {
            if (inc[i] + o > 255) {
                inc[i] = inc[i] + o - 256;
                o = 1;
            }
            else {
                inc[i] = inc[i] + o;
                break;
            }
        }
    }

    return inc;
}

export function sequenceEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length != b.length)
        return false;

    for (let i = 0; i != a.length; i++) {
        if (a[i] != b[i]) return false;
    }
    return true;
}

export function toString(src: Uint8Array): string {
    return String.fromCharCode.apply(null, src);
}

export function toBase64(src: Uint8Array, urlSafeMode = false): string {
    const x = btoa(this.toString(src));
    return urlSafeMode ? x.replace(/\+/g, '-').replace(/\//g, '_') : x;
}

const byteToHex = (new Array(256)).map(n => n.toString(16).padStart(2, '0'));
export function toHex(src: Uint8Array, delimiter = ''): string {
    return src.map(n => byteToHex[n]).join(delimiter);
}

export function toBytes(s: string, base64 = false): Uint8Array {
    if (base64) {
        const x = /[-_]/.test(s) ? s.replace(/\\-/g, '+').replace(/\\_/g, '/') : s;
        return new Uint8Array(atob(x).split('').map(function (c) { return c.charCodeAt(0); }));
    }
    else {
        const buf = new Uint8Array(s.length);
        for (let i = 0, l = s.length; i < l; i++) {
            buf[i] = s.charCodeAt(i);
        }
        return buf;
    }
}

export function getRandomBytes(size = 32): Uint8Array {
    const a = new Uint8Array(size);
    window.crypto.getRandomValues(a);
    return a;
}

export function getRandomString(size = 32): string {
    const a = getRandomBytes(size);
    return decoder.decode(a);
}

export function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
    const c = new Uint8Array(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}

export function concatBytesArrays(arrays: Array<Uint8Array>): Uint8Array {
    let length = 0;
    for (let i = 0; i < arrays.length; i++) {
        length += arrays[i].length;
    }
    const c = new Uint8Array(length);
    for (let i = 0, j = 0; i < arrays.length; i++) {
        c.set(arrays[i], j);
        j += arrays[i].length;
    }
    return c;
}

export function decode(a: Uint8Array): string {
    return decoder.decode(a);
}

export function encode(s: string): Uint8Array {
    return encoder.encode(s);
}

export async function hash(data: Uint8Array): Promise<Uint8Array> {
    return new Uint8Array(await window.crypto.subtle.digest({ name: 'SHA-256' }, data));
}

export async function hashBase64(s: string, urlSafeMode = false): Promise<string> {
    return toBase64(await hash(encoder.encode(s)), urlSafeMode);
}