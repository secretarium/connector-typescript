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
    var Key = /** @class */ (function () {
        function Key() {
            this.name = "";
            this.version = 0;
            this.cryptoKey = null;
            this.publicKeyRaw = null;
            this.save = false;
            this.imported = false;
            this.encrypted = false;
            this.isNew = false;
            this.exportableKey = null;
            this.exportUrl = "";
            this.exportableKeyEncrypted = null;
            this.exportUrlEncrypted = "";
        }
        Key.prototype.setCryptoKey = function (publicKey, privateKey) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            this.cryptoKey = { publicKey: publicKey, privateKey: privateKey };
                            _a = this;
                            _b = Uint8Array.bind;
                            return [4 /*yield*/, window.crypto.subtle.exportKey("raw", publicKey)];
                        case 1:
                            _a.publicKeyRaw = new (_b.apply(Uint8Array, [void 0, _c.sent()]))().subarray(1);
                            return [2 /*return*/];
                    }
                });
            });
        };
        Key.prototype.setCryptoKeyFromJwk = function (publicKey, privateKey) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _a = this.setCryptoKey;
                            return [4 /*yield*/, window.crypto.subtle.importKey("jwk", publicKey, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"])];
                        case 1:
                            _b = [_c.sent()];
                            return [4 /*yield*/, window.crypto.subtle.importKey("jwk", privateKey, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"])];
                        case 2:
                            _a.apply(this, _b.concat([_c.sent()]));
                            return [2 /*return*/];
                    }
                });
            });
        };
        Key.prototype.encrypt = function (pwd) {
            return __awaiter(this, void 0, void 0, function () {
                var salt, iv, weakPwd, strongPwd, key, json, data, encrypted, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.cryptoKey)
                                throw "Key is encrypted";
                            salt = Secretarium.Utils.getRandomBytes(32), iv = Secretarium.Utils.getRandomBytes(12), weakPwd = Secretarium.Utils.encode(pwd);
                            return [4 /*yield*/, Secretarium.Utils.hash(Secretarium.Utils.concatBytes(salt, weakPwd))];
                        case 1:
                            strongPwd = _b.sent();
                            return [4 /*yield*/, window.crypto.subtle.importKey("raw", strongPwd, "AES-GCM", false, ["encrypt", "decrypt"])];
                        case 2:
                            key = _b.sent(), json = JSON.stringify({ publicKey: this.exportableKey.publicKey, privateKey: this.exportableKey.privateKey }), data = Secretarium.Utils.encode(json);
                            _a = Uint8Array.bind;
                            return [4 /*yield*/, window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv, tagLength: 128 }, key, data)];
                        case 3:
                            encrypted = new (_a.apply(Uint8Array, [void 0, _b.sent()]))();
                            this.version = 1;
                            this.exportableKeyEncrypted = {
                                name: this.name, version: this.version, iv: Secretarium.Utils.toBase64(iv),
                                salt: Secretarium.Utils.toBase64(salt), data: Secretarium.Utils.toBase64(encrypted)
                            };
                            return [2 /*return*/, this];
                    }
                });
            });
        };
        Key.prototype.decrypt = function (pwd) {
            return __awaiter(this, void 0, void 0, function () {
                var iv, salt, encrypted, weakpwd, strongPwd, key, decrypted, _a, e_1, publicKey, privateKey, _b, _c, d, e_2;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            if (this.cryptoKey)
                                return [2 /*return*/, this];
                            if (!this.exportableKeyEncrypted)
                                throw "Key has not been imported";
                            iv = Secretarium.Utils.toBytes(this.exportableKeyEncrypted.iv, true), salt = Secretarium.Utils.toBytes(this.exportableKeyEncrypted.salt, true), encrypted = Secretarium.Utils.toBytes(this.exportableKeyEncrypted.data, true), weakpwd = Secretarium.Utils.encode(pwd);
                            return [4 /*yield*/, Secretarium.Utils.hash(Secretarium.Utils.concatBytes(salt, weakpwd))];
                        case 1:
                            strongPwd = _d.sent();
                            return [4 /*yield*/, window.crypto.subtle.importKey("raw", strongPwd, "AES-GCM", false, ["encrypt", "decrypt"])];
                        case 2:
                            key = _d.sent();
                            _d.label = 3;
                        case 3:
                            _d.trys.push([3, 5, , 6]);
                            _a = Uint8Array.bind;
                            return [4 /*yield*/, window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv, tagLength: 128 }, key, encrypted)];
                        case 4:
                            decrypted = new (_a.apply(Uint8Array, [void 0, _d.sent()]))();
                            return [3 /*break*/, 6];
                        case 5:
                            e_1 = _d.sent();
                            throw "Can't decrypt/invalid password";
                        case 6:
                            _d.trys.push([6, 16, , 17]);
                            if (!(this.version == 0)) return [3 /*break*/, 13];
                            return [4 /*yield*/, window.crypto.subtle.importKey("raw", decrypted.subarray(0, 65), { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"])];
                        case 7:
                            publicKey = _d.sent();
                            return [4 /*yield*/, window.crypto.subtle.importKey("pkcs8", decrypted.subarray(65), { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"])];
                        case 8:
                            privateKey = _d.sent();
                            return [4 /*yield*/, this.setCryptoKey(publicKey, privateKey)];
                        case 9:
                            _d.sent();
                            _b = this;
                            _c = {
                                name: this.name, version: 1
                            };
                            return [4 /*yield*/, window.crypto.subtle.exportKey("jwk", publicKey)];
                        case 10:
                            _c.publicKey = _d.sent();
                            return [4 /*yield*/, window.crypto.subtle.exportKey("jwk", privateKey)];
                        case 11:
                            _b.exportableKey = (_c.privateKey = _d.sent(),
                                _c);
                            return [4 /*yield*/, this.encrypt(pwd)];
                        case 12:
                            _d.sent(); // re-encrypt will migrate the encrypted exportable to the latest version
                            return [3 /*break*/, 15];
                        case 13:
                            d = JSON.parse(Secretarium.Utils.decode(decrypted));
                            return [4 /*yield*/, this.setCryptoKeyFromJwk(d.publicKey, d.privateKey)];
                        case 14:
                            _d.sent();
                            this.exportableKey = { name: this.name, version: 1, publicKey: d.publicKey, privateKey: d.privateKey };
                            _d.label = 15;
                        case 15: return [3 /*break*/, 17];
                        case 16:
                            e_2 = _d.sent();
                            throw "Key format is incorrect";
                        case 17: return [2 /*return*/, this];
                    }
                });
            });
        };
        Key.prototype.getPublicKeyHex = function (delimiter) {
            if (delimiter === void 0) { delimiter = ''; }
            if (!this.publicKeyRaw)
                throw "Key is encrypted";
            return Secretarium.Utils.toHex(this.publicKeyRaw, delimiter);
        };
        return Key;
    }());
    Secretarium.Key = Key;
    var KeysManager = /** @class */ (function () {
        function KeysManager() {
            this.keys = [];
            this.init();
        }
        KeysManager.prototype.addKey = function (key) {
            // unusual logic for reactivity
            var index = this.keys.findIndex(function (k) { return k.name == key.name; });
            if (index < 0)
                this.keys.push(key);
            else
                this.keys.splice(index, 1, key);
            return key;
        };
        KeysManager.prototype.init = function () {
            var _this = this;
            window.addEventListener('message', function (e) {
                if (e.origin !== "https://secretarium.com")
                    return;
                if (!e.data)
                    return;
                var keys = JSON.parse(e.data);
                for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                    var lsKey = keys_1[_i];
                    if (lsKey.encryptedKeys) { // retro-compat
                        lsKey.data = lsKey.encryptedKeys;
                    }
                    var key = new Key();
                    key.name = lsKey.name;
                    key.version = lsKey.version || 0;
                    key.save = true;
                    if (lsKey.publicKey) {
                        key.exportableKey = lsKey;
                        key.exportUrl = KeysManager.createObjectURL(lsKey);
                        key.setCryptoKeyFromJwk(key.exportableKey.publicKey, key.exportableKey.privateKey);
                    }
                    else {
                        key.exportableKeyEncrypted = lsKey;
                        key.exportUrlEncrypted = KeysManager.createObjectURL(lsKey);
                        key.encrypted = true;
                    }
                    _this.addKey(key);
                }
            });
            var f = document.createElement("iframe");
            f.setAttribute("src", "https://secretarium.com/user-keys/");
            f.setAttribute("id", "secretarium-com-frame");
            f.style.display = "none";
            f.onload = function () {
                f.contentWindow.postMessage({ type: "get" }, "https://secretarium.com");
            };
            document.body.appendChild(f);
        };
        KeysManager.createObjectURL = function (o) {
            var j = JSON.stringify(o, null, 4);
            var b = new Blob([j], { type: 'application/json;charset=utf-8;' });
            return URL.createObjectURL(b);
        };
        KeysManager.prototype.createKey = function (name) {
            return __awaiter(this, void 0, void 0, function () {
                var cryptoKey, key, _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (name.length == 0)
                                throw "Invalid key name";
                            return [4 /*yield*/, window.crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])];
                        case 1:
                            cryptoKey = _c.sent();
                            key = new Key();
                            key.name = name;
                            key.version = 1;
                            key.isNew = true;
                            key.setCryptoKey(cryptoKey.publicKey, cryptoKey.privateKey);
                            _a = key;
                            _b = {
                                name: name, version: 1
                            };
                            return [4 /*yield*/, window.crypto.subtle.exportKey("jwk", cryptoKey.publicKey)];
                        case 2:
                            _b.publicKey = _c.sent();
                            return [4 /*yield*/, window.crypto.subtle.exportKey("jwk", cryptoKey.privateKey)];
                        case 3:
                            _a.exportableKey = (_b.privateKey = _c.sent(),
                                _b);
                            key.exportUrl = KeysManager.createObjectURL(key.exportableKey);
                            return [2 /*return*/, this.addKey(key)];
                    }
                });
            });
        };
        KeysManager.prototype.importKeyFile = function (evt) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var e = evt.dataTransfer || evt.target; // dragged or browsed
                if (!e || !e.files)
                    reject("Unsupported, missing key file");
                if (e.files.length != 1)
                    reject("Unsupported, expecting a single key file");
                var reader = new FileReader();
                reader.onloadend = function () { return __awaiter(_this, void 0, void 0, function () {
                    var k, key, e_3;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 4, , 5]);
                                k = JSON.parse(reader.result);
                                key = new Key();
                                key.name = k.name;
                                key.version = k.version || 0;
                                key.imported = true;
                                if (!k.publicKey) return [3 /*break*/, 2];
                                key.exportableKey = k;
                                key.exportUrl = KeysManager.createObjectURL(k);
                                return [4 /*yield*/, key.setCryptoKeyFromJwk(key.exportableKey.publicKey, key.exportableKey.privateKey)];
                            case 1:
                                _a.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                key.exportableKeyEncrypted = k;
                                key.exportUrlEncrypted = KeysManager.createObjectURL(k);
                                key.encrypted = true;
                                _a.label = 3;
                            case 3:
                                resolve(key);
                                return [3 /*break*/, 5];
                            case 4:
                                e_3 = _a.sent();
                                reject(e_3.message);
                                return [3 /*break*/, 5];
                            case 5: return [2 /*return*/];
                        }
                    });
                }); };
                reader.onerror = function (e) { reject("Failed to load the key file"); };
                reader.readAsText(e.files[0]);
            });
        };
        KeysManager.prototype.removeKey = function (key) {
            var f = document.getElementById("secretarium-com-frame");
            f.contentWindow.postMessage({ type: "remove", data: { name: key.name, version: key.version } }, "https://secretarium.com");
        };
        KeysManager.prototype.saveKey = function (key) {
            var f = document.getElementById("secretarium-com-frame");
            f.contentWindow.postMessage({ type: "add", data: { name: key.name, version: key.version } }, "https://secretarium.com");
        };
        return KeysManager;
    }());
    Secretarium.KeysManager = KeysManager;
})(Secretarium || (Secretarium = {}));
//# sourceMappingURL=secretarium.keymanager.js.map