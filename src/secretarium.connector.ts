namespace Secretarium {

    class SCPSession {
        ecdh: CryptoKeyPair;
        ecdhPubKeyRaw: Uint8Array;
        serverEcdsaPubKey: CryptoKey;
        key: Uint8Array;
        iv: Uint8Array;
        cryptoKey: CryptoKey;
    }

    class QueryHandlers<T> {
        onError: (handler: (error: string) => any) => T;
        onResult: (handler: (result: object) => any) => T;
    }

    class TransactionHandlers<T> extends QueryHandlers<T> {
        onAcknowledged: (handler: () => any) => T;
        onProposed: (handler: () => any) => T;
        onCommitted: (handler: () => any) => T;
        onExecuted: (handler: () => any) => T;
    }

    class QueryNotificationHandlers {
        onError?: Array<(o: string) => any>;
        onResult?: Array<(o: object | string | void) => any>;
        failed?: boolean;
        promise: { resolve: (o: object | string | void) => any; reject: (o: string) => any };

        constructor(resolve: (o: object | string | void) => any, reject: (o: string) => any) {
            this.promise = { resolve, reject };
        }
    }

    class TransactionNotificationHandlers extends QueryNotificationHandlers {
        onAcknowledged?: Array<() => any>;
        onProposed?: Array<() => any>;
        onCommitted?: Array<() => any>;
        onExecuted?: Array<() => any>;

        constructor(resolve: (o: object | string | void) => any, reject: (o: string) => any) {
            super(resolve, reject);
        }
    }

    export class Query extends QueryHandlers<Query> {
        send: () => Promise<object | string | void>;
    }

    export class Transaction extends TransactionHandlers<Transaction> {
        send: () => Promise<object | string | void>;
    }

    export enum ConnectionState {
        connecting, secure, closing, closed
    }
    export const ConnectionStateMessage: Array<string> = [
        'Secure Connection in Progress', 'Secure Connection Established', 'Secure Connection Failed', 'Closed'
    ];

    export class SCP {

        private _socket: NNG.Ws;
        private _connectionState: ConnectionState;
        private _onStateChange: (state: ConnectionState) => any;
        private _onError: (err: string) => any;
        private _requests: { [key: string]: (QueryNotificationHandlers | TransactionNotificationHandlers) } = {};
        private _session: SCPSession;

        constructor() {
            this.reset();
        }

        reset() {
            if (this._socket && this._socket.state > NNG.State.closing)
                this._socket.close();

            this._session = null;
            this._onStateChange = null;
            this._onError = null;
            this._requests = {};
            this._updateState(3);
            return this;
        }

        private _updateState(state: ConnectionState) {
            this._connectionState = state;
            if (this._onStateChange != null)
                this._onStateChange(state);
        }

        private async _encrypt(data: Uint8Array): Promise<Uint8Array> {
            const ivOffset = Secretarium.Utils.getRandomBytes(16);
            const iv = Secretarium.Utils.incrementBy(this._session.iv, ivOffset);
            const encrypted = new Uint8Array(await window.crypto.subtle.encrypt({ name: 'AES-CTR', counter: iv, length: 128 },
                this._session.cryptoKey, data));
            return Secretarium.Utils.concatBytes(ivOffset, encrypted);
        }

        private async _decrypt(data: Uint8Array): Promise<Uint8Array> {
            const iv = Secretarium.Utils.incrementBy(this._session.iv, data.subarray(0, 16));
            return new Uint8Array(await window.crypto.subtle.decrypt({ name: 'AES-CTR', counter: iv, length: 128 },
                this._session.cryptoKey, data.subarray(16)));
        }

        private _notify(json: string): void {
            try {
                const o = JSON.parse(json);
                if (o != null && o.requestId) {
                    const x = this._requests[o.requestId];
                    if (!x) {
                        console.debug('Unexpected notification: ' + json);
                        return;
                    }
                    if (o.error) {
                        x.onError?.forEach(cb => cb(o.error));
                        x.failed = true;
                        x.promise.reject(o.error);
                    }
                    else if (o.result) {
                        x.onResult?.forEach(cb => cb(o.result));
                        x.promise.resolve(o.result);
                    }
                    else if (o.state) {
                        if (x.failed === true)
                            return;
                        const z = x as TransactionNotificationHandlers;
                        switch (o.state.toLowerCase()) {
                            case 'acknowledged': z.onAcknowledged?.forEach(cb => cb()); break;
                            case 'proposed': z.onProposed?.forEach(cb => cb()); break;
                            case 'committed': z.onCommitted?.forEach(cb => cb()); break;
                            case 'executed':
                                z.onExecuted?.forEach(cb => cb());
                                z.promise.resolve(o.result);
                                break;
                            case 'failed':
                                z.onError?.forEach(cb => cb('Transaction failed'));
                                z.failed = true;
                                z.promise.reject(o.error);
                                break;
                            default: break;
                        }
                    }
                }
            }
            catch (e) {
                const m = 'Error \'' + e.message + '\' when received \'' + json + '\'';
                if (this._onError)
                    this._onError(m);
                else
                    console.error(m);
            }
        }

        private _computeProofOfWork(nonce: Uint8Array): Uint8Array {
            return Secretarium.Utils.getRandomBytes(32); // proof-of-work verification is currently deactivated
        }

        get state(): ConnectionState {
            return this._connectionState;
        }

        get bufferedAmount(): number {
            return this._socket?.bufferedAmount;
        }

        connect(url: string, userKey: Key, knownTrustedKey: Uint8Array, protocol: NNG.Protocol = NNG.Protocol.pair1): Promise<any> {
            if (this._socket && this._socket.state > NNG.State.closing)
                this._socket.close();

            this._updateState(ConnectionState.closed);
            const session = this._session = new SCPSession();
            const socket = this._socket = new NNG.Ws();

            return new Promise((resolve, reject) => {
                new Promise((resolve, reject) => {
                    socket
                        .onopen(resolve)
                        .onerror(reject)
                        .onclose(reject)
                        .connect(url, protocol);
                })
                    .then(async () => {
                        socket.onopen(null)
                            .onerror(e => { this._updateState(ConnectionState.closed); })
                            .onclose(e => { this._updateState(ConnectionState.closed); });

                        session.ecdh = await window.crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
                        session.ecdhPubKeyRaw = new Uint8Array(await window.crypto.subtle.exportKey('raw', session.ecdh.publicKey)).subarray(1);
                        return new Promise((resolve, reject) => {
                            const tId = setTimeout(() => { reject('timeout after client hello'); }, 3000);
                            socket.onmessage(x => { clearTimeout(tId); resolve(x); }).send(session.ecdhPubKeyRaw);
                        });
                    })
                    .then((serverHello: Uint8Array) => {
                        const pow = this._computeProofOfWork(serverHello.subarray(0, 32));
                        const clientProofOfWork = Secretarium.Utils.concatBytesArrays([pow, knownTrustedKey]);
                        return new Promise((resolve, reject) => {
                            const tId = setTimeout(() => {reject('timeout after client proof-of-work'); }, 3000);
                            socket.onmessage(x => { clearTimeout(tId); resolve(x); }).send(clientProofOfWork);
                        });
                    })
                    .then(async (serverIdentity: Uint8Array) => {
                        const preMasterSecret = serverIdentity.subarray(0, 32);
                        const serverEcdhPubKey = await window.crypto.subtle.importKey('raw',
                            Secretarium.Utils.concatBytes(/*uncompressed*/Uint8Array.from([4]), serverIdentity.subarray(32, 96)),
                            { name: 'ECDH', namedCurve: 'P-256' }, false, []);
                        session.serverEcdsaPubKey = await window.crypto.subtle.importKey('raw',
                            Secretarium.Utils.concatBytes(/*uncompressed*/Uint8Array.from([4]), serverIdentity.subarray(serverIdentity.length - 64)),
                            { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);

                        // Check inheritance from Secretarium knownTrustedKey
                        const knownTrustedKeyPath = serverIdentity.subarray(96);
                        if (knownTrustedKeyPath.length == 64) {
                            if (!Secretarium.Utils.sequenceEqual(knownTrustedKey, knownTrustedKeyPath))
                                throw 'Invalid server identity';
                        }
                        else {
                            for (let i = 0; i < knownTrustedKeyPath.length - 64; i = i + 128) {
                                const key = knownTrustedKeyPath.subarray(i, 64);
                                const proof = knownTrustedKeyPath.subarray(i + 64, 64);
                                const keyChild = knownTrustedKeyPath.subarray(i + 128, 64);
                                const ecdsaKey = await window.crypto.subtle.importKey('raw',
                                    Secretarium.Utils.concatBytes(/*uncompressed*/Uint8Array.from([4]), key),
                                    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
                                if (!await window.crypto.subtle.verify({ name: 'ECDSA', hash: { name: 'SHA-256' } }, ecdsaKey, proof, keyChild))
                                    throw 'Invalid server identity chain at #' + i;
                            }
                        }

                        const commonSecret = await window.crypto.subtle.deriveBits(
                            { name: 'ECDH', public: serverEcdhPubKey }, session.ecdh.privateKey, 256);
                        const sha256Common = new Uint8Array(await window.crypto.subtle.digest({ name: 'SHA-256' }, commonSecret));
                        const symmetricKey = Secretarium.Utils.xor(preMasterSecret, sha256Common);
                        const key = symmetricKey.subarray(0, 16);
                        session.key = key;
                        session.iv = symmetricKey.subarray(16);
                        session.cryptoKey = await window.crypto.subtle.importKey('raw', key, 'AES-CTR', false, ['encrypt', 'decrypt']);

                        const nonce = Secretarium.Utils.getRandomBytes(32);
                        const signedNonce = new Uint8Array(await window.crypto.subtle.sign(
                            { name: 'ECDSA', hash: { name: 'SHA-256' } }, userKey.cryptoKey.privateKey, nonce));
                        const clientProofOfIdentity = Secretarium.Utils.concatBytesArrays(
                            [nonce, session.ecdhPubKeyRaw, userKey.publicKeyRaw, signedNonce]);

                        const encryptedClientProofOfIdentity = await this._encrypt(clientProofOfIdentity);
                        return new Promise((resolve, reject) => {
                            const tId = setTimeout(() => { reject('timeout after client proof-of-identity'); }, 3000);
                            socket.onmessage(x => { clearTimeout(tId); resolve(x); }).send(encryptedClientProofOfIdentity);
                        });
                    })
                    .then(async (serverProofOfIdentityEncrypted: Uint8Array) => {
                        const serverProofOfIdentity = await this._decrypt(serverProofOfIdentityEncrypted);
                        const welcome = Secretarium.Utils.encode('Hey you! Welcome to Secretarium!');
                        const toVerify = Secretarium.Utils.concatBytes(serverProofOfIdentity.subarray(0, 32), welcome);
                        const serverSignedHash = serverProofOfIdentity.subarray(32, 96);
                        const check = await window.crypto.subtle.verify({ name: 'ECDSA', hash: { name: 'SHA-256' } },
                            session.serverEcdsaPubKey, serverSignedHash, toVerify);
                        if (!check)
                            throw 'Invalid server proof of identity';

                        socket.onmessage(async encrypted => {
                            const data = await this._decrypt(encrypted);
                            const json = Secretarium.Utils.decode(data);
                            console.debug('received:' + json);
                            this._notify(json);
                        });

                        this._updateState(1);
                        resolve();
                    })
                    .catch(e => {
                        console.error('secure connection failed', e);
                        this._updateState(2);
                        socket.close();
                        this._updateState(3);
                        reject('Unable to create the secure connection: ' + e.message);
                    });
            });
        }

        onError(handler: (err: string) => any): SCP {
            this._onError = handler;
            return this;
        }

        onStatechange(handler: (state: ConnectionState) => any): SCP {
            this._onStateChange = handler;
            return this;
        }

        newQuery(app: string, command: string, requestId: string, args: object): Query {
            let cbs: QueryNotificationHandlers;
            const pm = new Promise<object | string | void>((resolve, reject) => {
                this._requests[requestId] = cbs = new QueryNotificationHandlers(resolve, reject);
            });
            const query = new Query();
            query.onError = x => { (cbs.onError = cbs.onError || []).push(x); return query; };
            query.onResult = x => { (cbs.onResult = cbs.onResult || []).push(x); return query; };
            query.send = () => { this.send(app, command, requestId, args); return pm; };
            return query;
        }

        newTx(app: string, command: string, requestId: string, args: object): Transaction {
            let cbs: TransactionNotificationHandlers;
            const pm = new Promise<object | string | void>((resolve, reject) => {
                this._requests[requestId] = cbs = new TransactionNotificationHandlers(resolve, reject);
            });
            const tx = new Transaction();
            tx.onError = x => { (cbs.onError = cbs.onError || []).push(x); return tx; };
            tx.onAcknowledged = x => { (cbs.onAcknowledged = cbs.onAcknowledged || []).push(x); return tx; };
            tx.onProposed = x => { (cbs.onProposed = cbs.onProposed || []).push(x); return tx; };
            tx.onCommitted = x => { (cbs.onCommitted = cbs.onCommitted || []).push(x); return tx; };
            tx.onExecuted = x => { (cbs.onExecuted = cbs.onExecuted || []).push(x); return tx; };
            tx.onResult = x => { (cbs.onResult = cbs.onResult || []).push(x); return tx; }; // for chained tx + query
            tx.send = () => { this.send(app, command, requestId, args); return pm; };
            return tx;
        }

        async send(app: string, command: string, requestId: string, args: object) {
            if (this._socket.state !== NNG.State.open) {
                const z = this._requests[requestId]?.onError;
                if (z) z.forEach(cb => cb('not connected'));
                else throw 'not connected';
            }

            const query = JSON.stringify({ 'dcapp': app, 'function': command, 'requestId': requestId, args: args });
            const data = Secretarium.Utils.encode(query);
            const encrypted = await this._encrypt(data);
            console.debug('sending:' + query);

            this._socket.send(encrypted);
        }

        close(): SCP {
            this._socket.close();
            return this;
        }
    }

}