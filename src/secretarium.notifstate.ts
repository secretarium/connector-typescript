class StateConfig {
    icon = '';
    color = '';
    styles?: Record<string, unknown>;
}

class StateData {
    title = '';
    opacity = 0.4;
    config: StateConfig | Array<StateConfig> | null = null;
}

type States = 'processing' | 'sent' | 'acknowledged' | 'proposed' | 'committed' | 'executed' | 'failed';

export const NotifStatesConfig: Record<States, StateConfig | StateConfig[]> = {
    processing: { icon: 'fa-cogs', color: 'text-secondary' },
    sent: { icon: 'fa-clock', color: 'text-secondary' },
    acknowledged: { icon: 'fa-check', color: 'text-secondary' },
    proposed: [
        { icon: 'fa-check', color: 'text-secondary' },
        { icon: 'fa-check', color: 'text-secondary', styles: { 'margin-left': '-.5em' } }
    ],
    committed: [
        { icon: 'fa-check', color: 'text-secondary' },
        { icon: 'fa-check', color: 'text-secondary', styles: { 'margin-left': '-.5em' } },
        { icon: 'fa-check', color: 'text-secondary', styles: { 'margin-left': '-.5em' } }
    ],
    executed: { icon: 'fa-check', color: 'text-success' },
    failed: { icon: 'fa-times', color: 'text-danger' }
};

export class NotifState {

    private _msg = '';
    private _visible = false;
    private _showChain = false;
    private _chained: Array<StateData> = [];
    private _chainIdx = 0;
    private _global: StateData;
    private _state?: States;
    private _timeout?: number;

    constructor(chained = 1) {
        this._showChain = chained > 1;
        this._global = Object.assign({}, { title: '', opacity: chained > 1 ? 0.4 : 1, config: NotifStatesConfig['sent'] });
        for (let i = 0; i < chained - 1; i++) {
            this._chained.push(Object.assign({}, { title: '', opacity: i == 0 ? 1 : 0.4, config: NotifStatesConfig['sent'] }));
        }
        this.reset();
    }

    private get _current(): StateData {
        return this._chainIdx < this._chained.length ? this._chained[this._chainIdx] : this._global;
    }

    _setState(state: States, msg = '', showMsg = false): NotifState {
        if (this._timeout)
            clearTimeout(this._timeout);
        this._msg = showMsg ? (msg != '' ? msg : state) : '';
        if (this._state == 'failed' && state != 'sent' && state != 'processing')
            return this;
        this._state = state;
        const title = msg != '' ? msg : (`${state}@${(new Date()).toTimeString().substr(0, 5)}`);
        Object.assign(this._current, { title: title, config: NotifStatesConfig[state] });
        return this.show();
    }

    get msg(): string {
        return this._msg;
    }
    get visible(): boolean {
        return this._visible;
    }
    get chainVisible(): boolean {
        return this._showChain;
    }
    get chained(): Array<StateData> {
        return this._chained;
    }
    get global(): StateData {
        return this._global;
    }

    show(): NotifState {
        this._visible = true; return this;
    }
    showChain(): NotifState {
        this._showChain = true; return this;
    }
    hide(waitMs = 5000): NotifState {
        if (waitMs > 0) this._timeout = window.setTimeout(() => { this._visible = false; }, waitMs);
        else this._visible = false;
        return this;
    }
    hideChain(): NotifState {
        this._showChain = false; return this;
    }
    reset(): NotifState {
        this._chainIdx = 0; return this;
    }
    processing(msg = '', showMsg = false): NotifState {
        return this.reset()._setState('processing', msg, showMsg).show();
    }
    start(msg = '', showMsg = false): NotifState {
        return this.reset()._setState('sent', msg, showMsg).show();
    }
    acknowledged(msg = '', showMsg = false): NotifState {
        return this._setState('acknowledged', msg, showMsg);
    }
    proposed(msg = '', showMsg = false): NotifState {
        return this._setState('proposed', msg, showMsg);
    }
    committed(msg = '', showMsg = false): NotifState {
        return this._setState('committed', msg, showMsg);
    }
    executed(msg = '', showMsg = false): NotifState {
        this._setState('executed', msg, showMsg);
        if (this._chainIdx < this._chained.length) { this._chainIdx++; }
        else { this._showChain = false; }
        this._current.opacity = 1;
        return this;
    }
    failed(msg = '', showMsg = false): NotifState {
        return this._setState('failed', msg, showMsg);
    }
}