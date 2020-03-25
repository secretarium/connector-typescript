var Secretarium;
(function (Secretarium) {
    var StateConfig = /** @class */ (function () {
        function StateConfig() {
            this.icon = "";
            this.color = "";
        }
        return StateConfig;
    }());
    var StateData = /** @class */ (function () {
        function StateData() {
            this.title = "";
            this.opacity = 0.4;
        }
        return StateData;
    }());
    Secretarium.NotifStatesConfig = {
        processing: { icon: "fa-cogs", color: "text-secondary" },
        sent: { icon: "fa-clock", color: "text-secondary" },
        acknowledged: { name: "acknowledged", icon: "fa-check", color: "text-secondary" },
        proposed: [
            { icon: "fa-check", color: "text-secondary" },
            { icon: "fa-check", color: "text-secondary", styles: { "margin-left": "-.5em" } }
        ],
        committed: [
            { icon: "fa-check", color: "text-secondary" },
            { icon: "fa-check", color: "text-secondary", styles: { "margin-left": "-.5em" } },
            { icon: "fa-check", color: "text-secondary", styles: { "margin-left": "-.5em" } }
        ],
        executed: { icon: "fa-check", color: "text-success" },
        failed: { icon: "fa-times", color: "text-danger" }
    };
    var NotifState = /** @class */ (function () {
        function NotifState(chained) {
            if (chained === void 0) { chained = 1; }
            this._msg = "";
            this._visible = false;
            this._showChain = false;
            this._chained = [];
            this._chainIdx = 0;
            this._state = "";
            this._timeout = 0;
            this._showChain = chained > 1;
            this._global = Object.assign({}, { title: "", opacity: chained > 1 ? 0.4 : 1, config: Secretarium.NotifStatesConfig["sent"] });
            for (var i = 0; i < chained - 1; i++) {
                this._chained.push(Object.assign({}, { title: "", opacity: i == 0 ? 1 : 0.4, config: Secretarium.NotifStatesConfig["sent"] }));
            }
            this.reset();
        }
        Object.defineProperty(NotifState.prototype, "_current", {
            get: function () {
                return this._chainIdx < this._chained.length ? this._chained[this._chainIdx] : this._global;
            },
            enumerable: true,
            configurable: true
        });
        NotifState.prototype._setState = function (state, msg, showMsg) {
            if (msg === void 0) { msg = ""; }
            if (showMsg === void 0) { showMsg = false; }
            clearTimeout(this._timeout);
            this._msg = showMsg ? (msg != "" ? msg : state) : "";
            if (this._state == "failed" && state != "sent" && state != "processing")
                return this;
            this._state = state;
            var title = msg != "" ? msg : (state + " @" + (new Date()).toTimeString().substr(0, 5));
            Object.assign(this._current, { title: title, config: Secretarium.NotifStatesConfig[state] });
            return this.show();
        };
        Object.defineProperty(NotifState.prototype, "msg", {
            get: function () { return this._msg; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NotifState.prototype, "visible", {
            get: function () { return this._visible; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NotifState.prototype, "chainVisible", {
            get: function () { return this._showChain; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NotifState.prototype, "chained", {
            get: function () { return this._chained; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NotifState.prototype, "global", {
            get: function () { return this._global; },
            enumerable: true,
            configurable: true
        });
        NotifState.prototype.show = function () { this._visible = true; return this; };
        NotifState.prototype.showChain = function () { this._showChain = true; return this; };
        NotifState.prototype.hide = function (waitMs) {
            var _this = this;
            if (waitMs === void 0) { waitMs = 5000; }
            if (waitMs > 0)
                this._timeout = setTimeout(function () { _this._visible = false; }, waitMs);
            else
                this._visible = false;
            return this;
        };
        NotifState.prototype.hideChain = function () { this._showChain = false; return this; };
        NotifState.prototype.reset = function () { this._chainIdx = 0; return this; };
        NotifState.prototype.processing = function (msg, showMsg) {
            if (msg === void 0) { msg = ""; }
            if (showMsg === void 0) { showMsg = false; }
            return this.reset()._setState("processing", msg, showMsg).show();
        };
        NotifState.prototype.start = function (msg, showMsg) {
            if (msg === void 0) { msg = ""; }
            if (showMsg === void 0) { showMsg = false; }
            return this.reset()._setState("sent", msg, showMsg).show();
        };
        NotifState.prototype.acknowledged = function (msg, showMsg) {
            if (msg === void 0) { msg = ""; }
            if (showMsg === void 0) { showMsg = false; }
            return this._setState("acknowledged", msg, showMsg);
        };
        NotifState.prototype.proposed = function (msg, showMsg) {
            if (msg === void 0) { msg = ""; }
            if (showMsg === void 0) { showMsg = false; }
            return this._setState("proposed", msg, showMsg);
        };
        NotifState.prototype.committed = function (msg, showMsg) {
            if (msg === void 0) { msg = ""; }
            if (showMsg === void 0) { showMsg = false; }
            return this._setState("committed", msg, showMsg);
        };
        NotifState.prototype.executed = function (msg, showMsg) {
            if (msg === void 0) { msg = ""; }
            if (showMsg === void 0) { showMsg = false; }
            this._setState("executed", msg, showMsg);
            if (this._chainIdx < this._chained.length) {
                this._chainIdx++;
            }
            else {
                this._showChain = false;
            }
            this._current.opacity = 1;
            return this;
        };
        NotifState.prototype.failed = function (msg, showMsg) {
            if (msg === void 0) { msg = ""; }
            if (showMsg === void 0) { showMsg = false; }
            return this._setState("failed", msg, showMsg);
        };
        return NotifState;
    }());
    Secretarium.NotifState = NotifState;
})(Secretarium || (Secretarium = {}));
//# sourceMappingURL=secretarium.notifstate.js.map