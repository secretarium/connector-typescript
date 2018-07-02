"use strict"

var sec, secretarium = sec = {

	knownTrustedKey: "rliD_CISqPEeYKbWYdwa-L-8oytAPvdGmbLC0KdvsH-OVMraarm1eo-q4fte0cWJ7-kmsq8wekFIJK0a83_yCg==",

	states: {
		socket: ["connecting", "open", "closing", "closed"],
		security:[
			"",
			"secure connection in progress",
			"secure connection established",
			"secure connection failed"
		]
	},

	WebSocket: class {

		constructor() {
			this.reset();
		}

		reset() {
			this.socket = new nng.WebSocket();
			this.handlers = {
				socket: {
					onMessage: null
				},
				onMessage: null,
				state: {
					onChange: null
				}
			},
			this.security = {
				state: 0,
				client: {},
				server: {}
			};
			return this;
		}

		get securityState() {
			return this.security.state;
		}

		_updateState(state) {
			this.security.state = state;
			if(this.handlers.state.onChange != null)
				this.handlers.state.onChange({ security: state });
		}

		async connect(url, protocol, userKey) {
			let s = new nng.WebSocket(), self = this, secKnownPubKey = new Uint8Array(sec.utils.base64ToUint8Array(sec.knownTrustedKey));

			this.socket = s;
			this._updateState(0);

			return new Promise((resolve, reject) => {
				s.on("open", e => { resolve() })
				.on("close", e => { reject() })
				.on("error", e => { reject() })
				.connect(url, protocol);
			})
			.then(async () => {
				self._updateState(1);
				s.on("open", e => { });
				s.on("close", e => { self._updateState(0); });
				s.on("error", e => { self._updateState(0); });
				let userPubExp = await window.crypto.subtle.exportKey("raw", userKey.publicKey);
				self.security.client.ecdsaPubRaw = new Uint8Array(userPubExp).subarray(1);
				console.log("client ECDSA pub key:" + Array.apply([], self.security.client.ecdsaPubRaw).join(","));
				self.security.client.ecdh = await window.crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
				let ecdhPubExp = await window.crypto.subtle.exportKey("raw", self.security.client.ecdh.publicKey);
				self.security.client.ecdhPubRaw = new Uint8Array(ecdhPubExp).subarray(1);
				console.log("client ephemereal ECDH pub key:" + Array.apply([], self.security.client.ecdhPubRaw).join(","));
				return new Promise((resolve, reject) => {
					let clientHello = self.security.client.ecdhPubRaw;
					s.on("message", x => { resolve(x); }).send(clientHello);
				});
			})
			.then(serverHello => {
				let nonce = serverHello.subarray(0, 32),
					pow = sec.utils.getRandomUint8Array(32); // pow disabled for this demo
				return new Promise((resolve, reject) => {
					let clientProofOfWork = sec.utils.concatUint8Arrays([pow, secKnownPubKey]);
					s.on("message", x => { resolve(x); }).send(clientProofOfWork);
				})
			})
			.then(async serverIdentity => {
				self.security.server.preMasterSecret = new Uint8Array(serverIdentity.subarray(0, 32));
				self.security.server.ecdhPub = await sec.utils.ecdh.importPub(sec.utils.concatUint8Array(/*uncompressed*/[4], serverIdentity.subarray(32, 96)));
				self.security.server.ecdsaPub = await sec.utils.ecdsa.importPub(sec.utils.concatUint8Array(/*uncompressed*/[4], serverIdentity.subarray(serverIdentity.length - 64)));

				// Check inheritance from Secretarium KnownPubKey
				let secKnownPubKeyPath = new Uint8Array(serverIdentity.subarray(96));
				if (secKnownPubKeyPath.length == 64) {
					if(!secKnownPubKey.secSequenceEqual(secKnownPubKeyPath))
						throw "Invalid server proof of identity";
				}
				else {
					for (var i = 0; i < secKnownPubKeyPath.length - 64; i = i + 128) {
						let key = secKnownPubKeyPath.subarray(i, 64), proof = secKnownPubKeyPath.subarray(i + 64, 64),
							keyChild = secKnownPubKeyPath.subarray(i + 128, 64),
							ecdsaKey = await sec.utils.ecdsa.importPub(sec.utils.concatUint8Array(/*uncompressed*/[4], key));
						if (!await sec.utils.ecdsa.verify(keyChild, proof, ecdsaKey))
							throw "Invalid server proof of identity #" + i;
					}
				}

				let commonSecret = await sec.utils.ecdh.deriveBits(self.security.server.ecdhPub, self.security.client.ecdh.privateKey),
					sha256Common = await sec.utils.hash(commonSecret),
					symmetricKey = self.security.server.preMasterSecret.secXor(new Uint8Array(sha256Common)),
					key = symmetricKey.subarray(0, 16);
				self.aesctr = {
					key: key, iv: symmetricKey.subarray(16),
					cryptokey: await window.crypto.subtle.importKey("raw", key, { name: "AES-CTR" }, false, ["encrypt", "decrypt"])
				}
				console.log("aesctr.key:" + Array.apply([], self.aesctr.key).join(","));
				console.log("aesctr.iv:" + Array.apply([], self.aesctr.iv).join(","));

				let nonce = sec.utils.getRandomUint8Array(32),
					signedNonce = new Uint8Array(await sec.utils.ecdsa.sign(nonce, userKey.privateKey)),
					clientProofOfIdentity = sec.utils.concatUint8Arrays(
						[nonce, self.security.client.ecdhPubRaw, self.security.client.ecdsaPubRaw, signedNonce]),
					ivOffset = sec.utils.getRandomUint8Array(16),
					iv = self.aesctr.iv.secIncrementBy(ivOffset),
					encryptedClientProofOfIdentity = await window.crypto.subtle.encrypt(
						{ name: "AES-CTR", counter: iv, length: 128 }, self.aesctr.cryptokey, clientProofOfIdentity)
				console.log("ivOffset:" + Array.apply([], ivOffset).join(","));
				console.log("ivIncremented:" + Array.apply([], iv).join(","));
				console.log("clientProofOfIdentity:" + Array.apply([], clientProofOfIdentity).join(","));
				return new Promise((resolve, reject) => {
					let m = sec.utils.concatUint8Arrays([ivOffset, new Uint8Array(encryptedClientProofOfIdentity)]);
					s.on("message", x => { resolve(x); }).send(m);
				})
			})
			.then(async serverProofOfIdentityEncrypted => {
				let ivOffset = serverProofOfIdentityEncrypted.subarray(0, 16),
					iv = self.aesctr.iv.secIncrementBy(ivOffset),
					serverProofOfIdentity = await window.crypto.subtle.decrypt(
						{ name: "AES-CTR", counter: iv, length: 128 }, self.aesctr.cryptokey, serverProofOfIdentityEncrypted.subarray(16)),
					welcome = sec.utils.encode("Hey you! Welcome to Secretarium!"),
					toVerify = sec.utils.concatUint8Array(new Uint8Array(serverProofOfIdentity).subarray(0, 32), welcome),
					serverSignedHash = new Uint8Array(serverProofOfIdentity).subarray(32, 96),
					ok = await sec.utils.ecdsa.verify(toVerify, serverSignedHash, self.security.server.ecdsaPub);
				if(!ok)
					throw "Invalid server proof of identity";

				self._updateState(2);
				s.on("message", self.handlers.socket.onMessage);
			})
			.catch(err => {
				console.log(err);
				self._updateState(3);
				s.close();
				throw "secure connection failed";
			});
		}

		on(evt, handler) {
			if(evt == "message") {
				var self = this;
				if(this.handlers.onMessage == null) {
					this.handlers.socket.onMessage = function(x) {
						let iv = self.aesctr.iv.secIncrementBy(x.subarray(0, 16));
						window.crypto.subtle.decrypt({ name: "AES-CTR", counter: iv, length: 128 }, self.aesctr.cryptokey, x.subarray(16))
						.then(decrypted => {
							let msg = new Uint8Array(decrypted);
							console.log("received:" + Array.apply([], msg).join(","));
							self.handlers.onMessage(msg);
						});
					}
				}
				this.handlers.onMessage = handler;
				this.socket.on(evt, this.handlers.socket.onMessage);
			} else if(evt == "close") {
				this.socket.on(evt, handler);
			} else if(evt == "open") {
				this.socket.on(evt, handler);
			} else if(evt == "error") {
				this.socket.on(evt, handler);
			} else if(evt == "statechange") {
				this.handlers.state.onChange = handler;
			}
			return this;
		}

		async send(data) {
			let ivOffset = sec.utils.getRandomUint8Array(16),
				iv = this.aesctr.iv.secIncrementBy(ivOffset),
				msg = await window.crypto.subtle.encrypt({ name: "AES-CTR", counter: iv, length: 128 }, this.aesctr.cryptokey, data);

			console.log("sending message");
			console.log("ivOffset:" + Array.apply([], ivOffset).join(","));
			console.log("iv:" + Array.apply([], iv).join(","));
			console.log("msg:" + Array.apply([], data).join(","));
			console.log("msgEncrypted:" + Array.apply([], new Uint8Array(msg)).join(","));

			this.socket.send(sec.utils.concatUint8Array(ivOffset, new Uint8Array(msg)));
			return this;
		}

		close() {
			this.socket.close();
			return this;
		}
	},

	utils: (function(){
		var decoder = new TextDecoder("utf-8"),
			encoder = new TextEncoder("utf-8");

		Uint8Array.prototype.secXor = function(a) {
			return this.map((x, i) => x ^ a[i]);
		}

		Uint8Array.prototype.secIncrementBy = function(offset) {
			let inc = Uint8Array.from(this),
				szDiff = this.length - offset.length;

			for (var j = offset.length - 1; j >= 0; j--)
            {
                for (var i = j + szDiff, o = offset[j]; i >= 0; i--)
                {
                    if (inc[i] + o > 255)
                    {
                        inc[i] = inc[i] + o - 256;
                        o = 1;
                    }
                    else
                    {
                        inc[i] = inc[i] + o;
                        break;
                    }
                }
            }

			return inc;
		}

		Uint8Array.prototype.secSequenceEqual = function(other) {
			if (this.length != other.length) return false;
			for (var i = 0; i != this.length; i++)
			{
				if (this[i] != other[i]) return false;
			}
			return true;
		}

		Uint8Array.prototype.secToString = function() {
			return String.fromCharCode.apply(null, this);
		}

		Uint8Array.prototype.secToBase64 = function() {
			return btoa(this.secToString());
		}

		Uint8Array.secFromString = function(str) {
			var buf = new Uint8Array(str.length);
			for (var i = 0, strLen = str.length; i < strLen; i++) {
				buf[i] = str.charCodeAt(i);
			}
			return buf;
		}

		Uint8Array.secFromBase64 = function(str) {
			return new Uint8Array(atob(str).split('').map(function (c) { return c.charCodeAt(0); }));
		}

		var getRandomUint8Array = function(size = 32) {
			let a = new Uint8Array(size);
			window.crypto.getRandomValues(a);
			return a;
		}

		return {
			getRandomUint8Array: getRandomUint8Array,
			getRandomString: function(size = 32) {
				let a = getRandomUint8Array(size);
				return decoder.decode(a);
			},
			concatUint8Array: function(a, b) {
				let c = new Uint8Array(a.length + b.length);
				c.set(a, 0);
				c.set(b, a.length);
				return c;
			},
			concatUint8Arrays: function(arrays) {
				let length = 0;
				for(let i = 0; i < arrays.length; i++) {
					length += arrays[i].length;
				}
				let c = new Uint8Array(length), j;
				for(let i = 0, j = 0; i < arrays.length; i++) {
					c.set(arrays[i], j);
					j += arrays[i].length;
				}
				return c;
			},
			decode: function(bin) {
				return decoder.decode(bin);
			},
			encode: function(str) {
				return encoder.encode(str);
			},
			hash: async function(data) {
				return window.crypto.subtle.digest({ name: "SHA-256" }, data);
			},
			base64ToUint8Array: function(str) {
				str = str.replace(/-/g, "+").replace(/_/g, "/");
				return new Uint8Array(atob(str).split('').map(function (c) { return c.charCodeAt(0); }));
			},
			ecdh: {
				importPub: async function (pub, format = "raw", exportable = false) {
					return window.crypto.subtle.importKey(format, pub, { name: "ECDH", namedCurve: "P-256" }, exportable,  []);
				},
				deriveBits: async function(pub, pri) {
					return window.crypto.subtle.deriveBits({ name: "ECDH", namedCurve: "P-256", public: pub }, pri, 256);
				}
			},
			ecdsa: {
				generateKeyPair: async function(exportable = false) {
					return window.crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, exportable, ["sign", "verify"]);
				},
				exportPub: async function(cryptokey, format = "raw") {
					return window.crypto.subtle.exportKey(format, cryptokey.publicKey);
				},
				exportPri: async function(cryptokey, format = "jwk") {
					return window.crypto.subtle.exportKey(format, cryptokey.privateKey);
				},
				importPub: async function (pub, format = "raw", exportable = true) {
					return window.crypto.subtle.importKey(format, pub, { name: "ECDSA", namedCurve: "P-256" }, exportable,  ["verify"]);
				},
				importPri: async function(pri, format = "jwk", exportable = false) {
					return window.crypto.subtle.importKey(format, pri, { name: "ECDSA", namedCurve: "P-256" }, exportable,  ["sign"]);
				},
				sign: async function(x, cryptokey) {
					return window.crypto.subtle.sign({ name: "ECDSA", hash: {name: "SHA-256"} }, cryptokey, x);
				},
				verify: async function(x, signature, cryptokey) {
					return window.crypto.subtle.verify({ name: "ECDSA", hash: {name: "SHA-256"} }, cryptokey, signature, x);
				}
			},
			aesgcm: {
				export: async function(cryptokey, format = "raw") {
					return window.crypto.subtle.exportKey(format, cryptokey);
				},
				import: async function(key, format = "raw", exportable = false) {
					return window.crypto.subtle.importKey(format, key, { name: "AES-GCM" }, exportable,  ["encrypt", "decrypt"]);
				},
				encrypt: async function(key, iv, data) {
					return window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv, tagLength: 128 }, key, data);
				},
				decrypt: async function(key, iv, data) {
					return window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv, tagLength: 128 }, key, data);
				}
			}
		}
	})()
}