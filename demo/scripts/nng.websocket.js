var NNG;
(function (NNG) {
    var Protocol;
    (function (Protocol) {
        Protocol["pair1"] = "pair1.sp.nanomsg.org";
        // todo: add other ones
    })(Protocol = NNG.Protocol || (NNG.Protocol = {}));
    var State;
    (function (State) {
        State[State["connecting"] = 0] = "connecting";
        State[State["open"] = 1] = "open";
        State[State["closing"] = 2] = "closing";
        State[State["closed"] = 3] = "closed";
    })(State = NNG.State || (NNG.State = {}));
    var Ws = /** @class */ (function () {
        function Ws() {
            this._handlers = { onopen: null, onclose: null, onerror: null, onmessage: null };
        }
        Object.defineProperty(Ws.prototype, "state", {
            get: function () {
                var _a;
                return (_a = this._socket) === null || _a === void 0 ? void 0 : _a.readyState;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Ws.prototype, "bufferedAmount", {
            get: function () {
                var _a;
                return (_a = this._socket) === null || _a === void 0 ? void 0 : _a.bufferedAmount;
            },
            enumerable: true,
            configurable: true
        });
        Ws.prototype._addHop = function (data) {
            var c = new Uint8Array(4 + data.length);
            c.set([0, 0, 0, 1], 0);
            c.set(data, 4);
            return c;
        };
        Ws.prototype.connect = function (url, protocol) {
            var s = new WebSocket(url, [protocol]);
            s.binaryType = "arraybuffer";
            s.onopen = this._socket && this._socket.onopen || this._handlers.onopen;
            s.onclose = this._socket && this._socket.onclose || this._handlers.onclose;
            s.onmessage = this._socket && this._socket.onmessage || this._handlers.onmessage;
            s.onerror = this._socket && this._socket.onerror || this._handlers.onerror;
            this._requiresHop = protocol == Protocol.pair1;
            this._socket = s;
            return this;
        };
        Ws.prototype.onopen = function (handler) {
            this._handlers.onopen = handler;
            if (this._socket)
                this._socket.onopen = handler;
            return this;
        };
        Ws.prototype.onclose = function (handler) {
            this._handlers.onclose = handler;
            if (this._socket)
                this._socket.onclose = handler;
            return this;
        };
        Ws.prototype.onerror = function (handler) {
            this._handlers.onerror = handler;
            if (this._socket)
                this._socket.onerror = handler;
            return this;
        };
        Ws.prototype.onmessage = function (handler) {
            var _this = this;
            this._handlers.onmessage = function (e) {
                var data = new Uint8Array(e.data);
                if (_this._requiresHop)
                    data = data.subarray(4);
                return handler(data);
            };
            if (this._socket)
                this._socket.onmessage = this._handlers.onmessage;
            return this;
        };
        Ws.prototype.send = function (data) {
            if (this._requiresHop)
                data = this._addHop(data);
            this._socket.send(data);
            return this;
        };
        Ws.prototype.close = function () {
            this._socket.close();
            return this;
        };
        return Ws;
    }());
    NNG.Ws = Ws;
})(NNG || (NNG = {}));
//# sourceMappingURL=nng.websocket.js.map