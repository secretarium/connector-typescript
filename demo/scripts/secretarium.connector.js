var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var Secretarium;
(function (Secretarium) {
    var SCPSession = /** @class */ (function () {
        function SCPSession() {
        }
        return SCPSession;
    }());
    var QueryHandlers = /** @class */ (function () {
        function QueryHandlers() {
        }
        return QueryHandlers;
    }());
    var TransactionHandlers = /** @class */ (function (_super) {
        __extends(TransactionHandlers, _super);
        function TransactionHandlers() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return TransactionHandlers;
    }(QueryHandlers));
    var QueryNotificationHandlers = /** @class */ (function () {
        function QueryNotificationHandlers(resolve, reject) {
            this.promise = { resolve: resolve, reject: reject };
        }
        return QueryNotificationHandlers;
    }());
    var TransactionNotificationHandlers = /** @class */ (function (_super) {
        __extends(TransactionNotificationHandlers, _super);
        function TransactionNotificationHandlers(resolve, reject) {
            return _super.call(this, resolve, reject) || this;
        }
        return TransactionNotificationHandlers;
    }(QueryNotificationHandlers));
    var Query = /** @class */ (function (_super) {
        __extends(Query, _super);
        function Query() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Query;
    }(QueryHandlers));
    Secretarium.Query = Query;
    var Transaction = /** @class */ (function (_super) {
        __extends(Transaction, _super);
        function Transaction() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Transaction;
    }(TransactionHandlers));
    Secretarium.Transaction = Transaction;
    var ConnectionState;
    (function (ConnectionState) {
        ConnectionState[ConnectionState["connecting"] = 0] = "connecting";
        ConnectionState[ConnectionState["secure"] = 1] = "secure";
        ConnectionState[ConnectionState["closing"] = 2] = "closing";
        ConnectionState[ConnectionState["closed"] = 3] = "closed";
    })(ConnectionState = Secretarium.ConnectionState || (Secretarium.ConnectionState = {}));
    Secretarium.ConnectionStateMessage = [
        "Secure Connection in Progress", "Secure Connection Established", "Secure Connection Failed", "Closed"
    ];
    var SCP = /** @class */ (function () {
        function SCP() {
            this._requests = {};
            this.reset();
        }
        SCP.prototype.reset = function () {
            if (this._socket && this._socket.state > NNG.State.closing)
                this._socket.close();
            this._session = null;
            this._onStateChange = null;
            this._onError = null;
            this._requests = {};
            this._updateState(3);
            return this;
        };
        SCP.prototype._updateState = function (state) {
            this._connectionState = state;
            if (this._onStateChange != null)
                this._onStateChange(state);
        };
        SCP.prototype._encrypt = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var ivOffset, iv, encrypted, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            ivOffset = Secretarium.Utils.getRandomBytes(16);
                            iv = Secretarium.Utils.incrementBy(this._session.iv, ivOffset);
                            _a = Uint8Array.bind;
                            return [4 /*yield*/, window.crypto.subtle.encrypt({ name: "AES-CTR", counter: iv, length: 128 }, this._session.cryptoKey, data)];
                        case 1:
                            encrypted = new (_a.apply(Uint8Array, [void 0, _b.sent()]))();
                            return [2 /*return*/, Secretarium.Utils.concatBytes(ivOffset, encrypted)];
                    }
                });
            });
        };
        SCP.prototype._decrypt = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var iv, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            iv = Secretarium.Utils.incrementBy(this._session.iv, data.subarray(0, 16));
                            _a = Uint8Array.bind;
                            return [4 /*yield*/, window.crypto.subtle.decrypt({ name: "AES-CTR", counter: iv, length: 128 }, this._session.cryptoKey, data.subarray(16))];
                        case 1: return [2 /*return*/, new (_a.apply(Uint8Array, [void 0, _b.sent()]))()];
                    }
                });
            });
        };
        SCP.prototype._notify = function (json) {
            var _a, _b, _c, _d, _e, _f, _g;
            try {
                var o_1 = JSON.parse(json);
                if (o_1 != null && o_1.requestId) {
                    var x = this._requests[o_1.requestId];
                    if (!x) {
                        console.debug("Unexpected notification: " + json);
                        return;
                    }
                    if (o_1.error) {
                        (_a = x.onError) === null || _a === void 0 ? void 0 : _a.forEach(function (cb) { return cb(o_1.error); });
                        x.failed = true;
                        x.promise.reject(o_1.error);
                    }
                    else if (o_1.result) {
                        (_b = x.onResult) === null || _b === void 0 ? void 0 : _b.forEach(function (cb) { return cb(o_1.result); });
                        x.promise.resolve(o_1.result);
                    }
                    else if (o_1.state) {
                        if (x.failed === true)
                            return;
                        var z = x;
                        switch (o_1.state.toLowerCase()) {
                            case "acknowledged":
                                (_c = z.onAcknowledged) === null || _c === void 0 ? void 0 : _c.forEach(function (cb) { return cb(); });
                                break;
                            case "proposed":
                                (_d = z.onProposed) === null || _d === void 0 ? void 0 : _d.forEach(function (cb) { return cb(); });
                                break;
                            case "committed":
                                (_e = z.onCommitted) === null || _e === void 0 ? void 0 : _e.forEach(function (cb) { return cb(); });
                                break;
                            case "executed":
                                (_f = z.onExecuted) === null || _f === void 0 ? void 0 : _f.forEach(function (cb) { return cb(); });
                                z.promise.resolve(o_1.result);
                                break;
                            case "failed":
                                (_g = z.onError) === null || _g === void 0 ? void 0 : _g.forEach(function (cb) { return cb("Transaction failed"); });
                                z.failed = true;
                                z.promise.reject(o_1.error);
                                break;
                            default: break;
                        }
                    }
                }
            }
            catch (e) {
                var m = "Error '" + e.message + "' when received '" + json + "'";
                if (this._onError)
                    this._onError(m);
                else
                    console.error(m);
            }
        };
        SCP.prototype._computeProofOfWork = function (nonce) {
            return Secretarium.Utils.getRandomBytes(32); // proof-of-work verification is currently deactivated
        };
        Object.defineProperty(SCP.prototype, "state", {
            get: function () {
                return this._connectionState;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SCP.prototype, "bufferedAmount", {
            get: function () {
                var _a;
                return (_a = this._socket) === null || _a === void 0 ? void 0 : _a.bufferedAmount;
            },
            enumerable: true,
            configurable: true
        });
        SCP.prototype.connect = function (url, userKey, knownTrustedKey, protocol) {
            var _this = this;
            if (protocol === void 0) { protocol = NNG.Protocol.pair1; }
            if (this._socket && this._socket.state > NNG.State.closing)
                this._socket.close();
            this._updateState(ConnectionState.closed);
            var session = this._session = new SCPSession();
            var socket = this._socket = new NNG.Ws();
            return new Promise(function (resolve, reject) {
                new Promise(function (resolve, reject) {
                    socket
                        .onopen(resolve)
                        .onerror(reject)
                        .onclose(reject)
                        .connect(url, protocol);
                })
                    .then(function () { return __awaiter(_this, void 0, void 0, function () {
                    var _a, _b, _c;
                    var _this = this;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                socket.onopen(null)
                                    .onerror(function (e) { _this._updateState(ConnectionState.closed); })
                                    .onclose(function (e) { _this._updateState(ConnectionState.closed); });
                                _a = session;
                                return [4 /*yield*/, window.crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])];
                            case 1:
                                _a.ecdh = _d.sent();
                                _b = session;
                                _c = Uint8Array.bind;
                                return [4 /*yield*/, window.crypto.subtle.exportKey("raw", session.ecdh.publicKey)];
                            case 2:
                                _b.ecdhPubKeyRaw = new (_c.apply(Uint8Array, [void 0, _d.sent()]))().subarray(1);
                                return [2 /*return*/, new Promise(function (resolve, reject) {
                                        var tId = setTimeout(function () { reject('timeout after client hello'); }, 3000);
                                        socket.onmessage(function (x) { clearTimeout(tId); resolve(x); }).send(session.ecdhPubKeyRaw);
                                    })];
                        }
                    });
                }); })
                    .then(function (serverHello) {
                    var pow = _this._computeProofOfWork(serverHello.subarray(0, 32));
                    var clientProofOfWork = Secretarium.Utils.concatBytesArrays([pow, knownTrustedKey]);
                    return new Promise(function (resolve, reject) {
                        var tId = setTimeout(function () { reject('timeout after client proof-of-work'); }, 3000);
                        socket.onmessage(function (x) { clearTimeout(tId); resolve(x); }).send(clientProofOfWork);
                    });
                })
                    .then(function (serverIdentity) { return __awaiter(_this, void 0, void 0, function () {
                    var preMasterSecret, serverEcdhPubKey, _a, knownTrustedKeyPath, i, key_1, proof, keyChild, ecdsaKey, commonSecret, sha256Common, _b, symmetricKey, key, _c, nonce, signedNonce, _d, clientProofOfIdentity, encryptedClientProofOfIdentity;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                preMasterSecret = serverIdentity.subarray(0, 32);
                                return [4 /*yield*/, window.crypto.subtle.importKey("raw", Secretarium.Utils.concatBytes(/*uncompressed*/ Uint8Array.from([4]), serverIdentity.subarray(32, 96)), { name: "ECDH", namedCurve: "P-256" }, false, [])];
                            case 1:
                                serverEcdhPubKey = _e.sent();
                                _a = session;
                                return [4 /*yield*/, window.crypto.subtle.importKey("raw", Secretarium.Utils.concatBytes(/*uncompressed*/ Uint8Array.from([4]), serverIdentity.subarray(serverIdentity.length - 64)), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"])];
                            case 2:
                                _a.serverEcdsaPubKey = _e.sent();
                                knownTrustedKeyPath = serverIdentity.subarray(96);
                                if (!(knownTrustedKeyPath.length == 64)) return [3 /*break*/, 3];
                                if (!Secretarium.Utils.sequenceEqual(knownTrustedKey, knownTrustedKeyPath))
                                    throw "Invalid server identity";
                                return [3 /*break*/, 8];
                            case 3:
                                i = 0;
                                _e.label = 4;
                            case 4:
                                if (!(i < knownTrustedKeyPath.length - 64)) return [3 /*break*/, 8];
                                key_1 = knownTrustedKeyPath.subarray(i, 64);
                                proof = knownTrustedKeyPath.subarray(i + 64, 64);
                                keyChild = knownTrustedKeyPath.subarray(i + 128, 64);
                                return [4 /*yield*/, window.crypto.subtle.importKey("raw", Secretarium.Utils.concatBytes(/*uncompressed*/ Uint8Array.from([4]), key_1), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"])];
                            case 5:
                                ecdsaKey = _e.sent();
                                return [4 /*yield*/, window.crypto.subtle.verify({ name: "ECDSA", hash: { name: "SHA-256" } }, ecdsaKey, proof, keyChild)];
                            case 6:
                                if (!(_e.sent()))
                                    throw "Invalid server identity chain at #" + i;
                                _e.label = 7;
                            case 7:
                                i = i + 128;
                                return [3 /*break*/, 4];
                            case 8: return [4 /*yield*/, window.crypto.subtle.deriveBits({ name: "ECDH", public: serverEcdhPubKey }, session.ecdh.privateKey, 256)];
                            case 9:
                                commonSecret = _e.sent();
                                _b = Uint8Array.bind;
                                return [4 /*yield*/, window.crypto.subtle.digest({ name: "SHA-256" }, commonSecret)];
                            case 10:
                                sha256Common = new (_b.apply(Uint8Array, [void 0, _e.sent()]))();
                                symmetricKey = Secretarium.Utils.xor(preMasterSecret, sha256Common);
                                key = symmetricKey.subarray(0, 16);
                                session.key = key;
                                session.iv = symmetricKey.subarray(16);
                                _c = session;
                                return [4 /*yield*/, window.crypto.subtle.importKey("raw", key, "AES-CTR", false, ["encrypt", "decrypt"])];
                            case 11:
                                _c.cryptoKey = _e.sent();
                                nonce = Secretarium.Utils.getRandomBytes(32);
                                _d = Uint8Array.bind;
                                return [4 /*yield*/, window.crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, userKey.cryptoKey.privateKey, nonce)];
                            case 12:
                                signedNonce = new (_d.apply(Uint8Array, [void 0, _e.sent()]))();
                                clientProofOfIdentity = Secretarium.Utils.concatBytesArrays([nonce, session.ecdhPubKeyRaw, userKey.publicKeyRaw, signedNonce]);
                                return [4 /*yield*/, this._encrypt(clientProofOfIdentity)];
                            case 13:
                                encryptedClientProofOfIdentity = _e.sent();
                                return [2 /*return*/, new Promise(function (resolve, reject) {
                                        var tId = setTimeout(function () { reject('timeout after client proof-of-identity'); }, 3000);
                                        socket.onmessage(function (x) { clearTimeout(tId); resolve(x); }).send(encryptedClientProofOfIdentity);
                                    })];
                        }
                    });
                }); })
                    .then(function (serverProofOfIdentityEncrypted) { return __awaiter(_this, void 0, void 0, function () {
                    var serverProofOfIdentity, welcome, toVerify, serverSignedHash, check;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this._decrypt(serverProofOfIdentityEncrypted)];
                            case 1:
                                serverProofOfIdentity = _a.sent();
                                welcome = Secretarium.Utils.encode("Hey you! Welcome to Secretarium!");
                                toVerify = Secretarium.Utils.concatBytes(serverProofOfIdentity.subarray(0, 32), welcome);
                                serverSignedHash = serverProofOfIdentity.subarray(32, 96);
                                return [4 /*yield*/, window.crypto.subtle.verify({ name: "ECDSA", hash: { name: "SHA-256" } }, session.serverEcdsaPubKey, serverSignedHash, toVerify)];
                            case 2:
                                check = _a.sent();
                                if (!check)
                                    throw "Invalid server proof of identity";
                                socket.onmessage(function (encrypted) { return __awaiter(_this, void 0, void 0, function () {
                                    var data, json;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this._decrypt(encrypted)];
                                            case 1:
                                                data = _a.sent();
                                                json = Secretarium.Utils.decode(data);
                                                console.debug("received:" + json);
                                                this._notify(json);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                this._updateState(1);
                                resolve();
                                return [2 /*return*/];
                        }
                    });
                }); })
                    .catch(function (e) {
                    console.error("secure connection failed", e);
                    _this._updateState(2);
                    socket.close();
                    _this._updateState(3);
                    reject("Unable to create the secure connection: " + e.message);
                });
            });
        };
        SCP.prototype.onError = function (handler) {
            this._onError = handler;
            return this;
        };
        SCP.prototype.onStatechange = function (handler) {
            this._onStateChange = handler;
            return this;
        };
        SCP.prototype.newQuery = function (app, command, requestId, args) {
            var _this = this;
            var cbs;
            var pm = new Promise(function (resolve, reject) {
                _this._requests[requestId] = cbs = new QueryNotificationHandlers(resolve, reject);
            });
            var query = new Query();
            query.onError = function (x) { (cbs.onError = cbs.onError || []).push(x); return query; };
            query.onResult = function (x) { (cbs.onResult = cbs.onResult || []).push(x); return query; };
            query.send = function () { _this.send(app, command, requestId, args); return pm; };
            return query;
        };
        SCP.prototype.newTx = function (app, command, requestId, args) {
            var _this = this;
            var cbs;
            var pm = new Promise(function (resolve, reject) {
                _this._requests[requestId] = cbs = new TransactionNotificationHandlers(resolve, reject);
            });
            var tx = new Transaction();
            tx.onError = function (x) { (cbs.onError = cbs.onError || []).push(x); return tx; };
            tx.onAcknowledged = function (x) { (cbs.onAcknowledged = cbs.onAcknowledged || []).push(x); return tx; };
            tx.onProposed = function (x) { (cbs.onProposed = cbs.onProposed || []).push(x); return tx; };
            tx.onCommitted = function (x) { (cbs.onCommitted = cbs.onCommitted || []).push(x); return tx; };
            tx.onExecuted = function (x) { (cbs.onExecuted = cbs.onExecuted || []).push(x); return tx; };
            tx.onResult = function (x) { (cbs.onResult = cbs.onResult || []).push(x); return tx; }; // for chained tx + query
            tx.send = function () { _this.send(app, command, requestId, args); return pm; };
            return tx;
        };
        SCP.prototype.send = function (app, command, requestId, args) {
            var _a;
            return __awaiter(this, void 0, void 0, function () {
                var z, query, data, encrypted;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (this._socket.state !== NNG.State.open) {
                                z = (_a = this._requests[requestId]) === null || _a === void 0 ? void 0 : _a.onError;
                                if (z)
                                    z.forEach(function (cb) { return cb("not connected"); });
                                else
                                    throw "not connected";
                            }
                            query = JSON.stringify({ "dcapp": app, "function": command, "requestId": requestId, args: args });
                            data = Secretarium.Utils.encode(query);
                            return [4 /*yield*/, this._encrypt(data)];
                        case 1:
                            encrypted = _b.sent();
                            console.debug("sending:" + query);
                            this._socket.send(encrypted);
                            return [2 /*return*/];
                    }
                });
            });
        };
        SCP.prototype.close = function () {
            this._socket.close();
            return this;
        };
        return SCP;
    }());
    Secretarium.SCP = SCP;
})(Secretarium || (Secretarium = {}));
//# sourceMappingURL=secretarium.connector.js.map