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
    var Utils;
    (function (Utils) {
        var decoder = new TextDecoder("utf-8");
        var encoder = new TextEncoder();
        function xor(a, b) {
            if (a.length != b.length)
                throw "array should have the same size";
            return a.map(function (x, i) { return x ^ b[i]; });
        }
        Utils.xor = xor;
        function incrementBy(src, offset) {
            var inc = Uint8Array.from(src), szDiff = src.length - offset.length;
            for (var j = offset.length - 1; j >= 0; j--) {
                for (var i = j + szDiff, o = offset[j]; i >= 0; i--) {
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
        Utils.incrementBy = incrementBy;
        function sequenceEqual(a, b) {
            if (a.length != b.length)
                return false;
            for (var i = 0; i != a.length; i++) {
                if (a[i] != b[i])
                    return false;
            }
            return true;
        }
        Utils.sequenceEqual = sequenceEqual;
        function toString(src) {
            return String.fromCharCode.apply(null, src);
        }
        Utils.toString = toString;
        function toBase64(src, urlSafeMode) {
            if (urlSafeMode === void 0) { urlSafeMode = false; }
            var x = btoa(this.toString(src));
            return urlSafeMode ? x.replace(/\+/g, "-").replace(/\//g, "_") : x;
        }
        Utils.toBase64 = toBase64;
        var byteToHex = (new Array(256)).map(function (n) { return n.toString(16).padStart(2, "0"); });
        function toHex(src, delimiter) {
            if (delimiter === void 0) { delimiter = ''; }
            return src.map(function (n) { return byteToHex[n]; }).join(delimiter);
        }
        Utils.toHex = toHex;
        function toBytes(s, base64) {
            if (base64 === void 0) { base64 = false; }
            if (base64) {
                var x = /[-_]/.test(s) ? s.replace(/\-/g, "+").replace(/\_/g, "/") : s;
                return new Uint8Array(atob(x).split('').map(function (c) { return c.charCodeAt(0); }));
            }
            else {
                var buf = new Uint8Array(s.length);
                for (var i = 0, l = s.length; i < l; i++) {
                    buf[i] = s.charCodeAt(i);
                }
                return buf;
            }
        }
        Utils.toBytes = toBytes;
        function getRandomBytes(size) {
            if (size === void 0) { size = 32; }
            var a = new Uint8Array(size);
            window.crypto.getRandomValues(a);
            return a;
        }
        Utils.getRandomBytes = getRandomBytes;
        function getRandomString(size) {
            if (size === void 0) { size = 32; }
            var a = getRandomBytes(size);
            return decoder.decode(a);
        }
        Utils.getRandomString = getRandomString;
        function concatBytes(a, b) {
            var c = new Uint8Array(a.length + b.length);
            c.set(a, 0);
            c.set(b, a.length);
            return c;
        }
        Utils.concatBytes = concatBytes;
        function concatBytesArrays(arrays) {
            var length = 0;
            for (var i = 0; i < arrays.length; i++) {
                length += arrays[i].length;
            }
            var c = new Uint8Array(length), j;
            for (var i = 0, j_1 = 0; i < arrays.length; i++) {
                c.set(arrays[i], j_1);
                j_1 += arrays[i].length;
            }
            return c;
        }
        Utils.concatBytesArrays = concatBytesArrays;
        function decode(a) {
            return decoder.decode(a);
        }
        Utils.decode = decode;
        function encode(s) {
            return encoder.encode(s);
        }
        Utils.encode = encode;
        function hash(data) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = Uint8Array.bind;
                            return [4 /*yield*/, window.crypto.subtle.digest({ name: "SHA-256" }, data)];
                        case 1: return [2 /*return*/, new (_a.apply(Uint8Array, [void 0, _b.sent()]))()];
                    }
                });
            });
        }
        Utils.hash = hash;
        function hashBase64(s, urlSafeMode) {
            if (urlSafeMode === void 0) { urlSafeMode = false; }
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = toBase64;
                            return [4 /*yield*/, hash(encoder.encode(s))];
                        case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), urlSafeMode])];
                    }
                });
            });
        }
        Utils.hashBase64 = hashBase64;
    })(Utils = Secretarium.Utils || (Secretarium.Utils = {}));
})(Secretarium || (Secretarium = {}));
//# sourceMappingURL=secretarium.utils.js.map