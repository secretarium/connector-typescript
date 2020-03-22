namespace Secretarium {

    class StateConfig {
        icon: string = "";
        color: string = "";
        styles?: object;
    }

    class StateData {
        title: string = "";
        opacity: number = 0.4;
        config: StateConfig | Array<StateConfig>;
    }

    export const NotifStatesConfig = {
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
    }

    export class NotifState {

        private _msg: string = "";
        private _visible: boolean = false;
        private _showChain: boolean = false;
        private _chained: Array<StateData> = [];
        private _chainIdx: number = 0;
        private _global: StateData;
        private _state: string = "";
        private _timeout: number = 0;

        constructor(chained: number = 1) {
            this._showChain = chained > 1;
            this._global = Object.assign({}, { title: "", opacity: chained > 1 ? 0.4 : 1, config: NotifStatesConfig["sent"] });
            for (let i = 0; i < chained - 1; i++) {
                this._chained.push(Object.assign({}, { title: "", opacity: i == 0 ? 1 : 0.4, config: NotifStatesConfig["sent"] }));
            }
            this.reset();
        }

        private get _current(): StateData {
            return this._chainIdx < this._chained.length ? this._chained[this._chainIdx] : this._global;
        }

        _setState(state: string, msg: string = "", showMsg: boolean = false) {
            clearTimeout(this._timeout);
            this._msg = showMsg ? (msg != "" ? msg : state) : "";
            if (this._state == "failed" && state != "sent" && state != "processing") return this;
            this._state = state;
            const title = msg != "" ? msg : (state + " @" + (new Date()).toTimeString().substr(0, 5));
            Object.assign(this._current, { title: title, config: (NotifStatesConfig as any)[state] });
            return this.show();
        }

        get msg(): string { return this._msg; }
        get visible(): boolean { return this._visible; }
        get chainVisible(): boolean { return this._showChain; }
        get chained(): Array<StateData> { return this._chained; }
        get global(): StateData { return this._global; }

        show() { this._visible = true; return this; }
        showChain() { this._showChain = true; return this; }
        hide(waitMs = 5000) {
            if (waitMs > 0) this._timeout = setTimeout(() => { this._visible = false; }, waitMs);
            else this._visible = false;
            return this;
        }
        hideChain() { this._showChain = false; return this; }
        reset() { this._chainIdx = 0; return this; }
        processing(msg = "", showMsg = false) { return this.reset()._setState("processing", msg, showMsg).show(); }
        start(msg = "", showMsg = false) { return this.reset()._setState("sent", msg, showMsg).show(); }
        acknowledged(msg = "", showMsg = false) { return this._setState("acknowledged", msg, showMsg); }
        proposed(msg = "", showMsg = false) { return this._setState("proposed", msg, showMsg); }
        committed(msg = "", showMsg = false) { return this._setState("committed", msg, showMsg); }
        executed(msg = "", showMsg = false) {
            this._setState("executed", msg, showMsg);
            if (this._chainIdx < this._chained.length) { this._chainIdx++; }
            else { this._showChain = false; }
            this._current.opacity = 1;
            return this;
        }
        failed(msg = "", showMsg = false) { return this._setState("failed", msg, showMsg); }
    }

}