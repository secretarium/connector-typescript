export enum Protocol {
    pair1 = 'pair1.sp.nanomsg.org'
    // todo: add other ones
}

export enum State {
    connecting, open, closing, closed
}

interface SocketHandlers {
    onclose: ((ev: CloseEvent) => any) | null;
    onerror: ((ev: Event) => any) | null;
    onmessage: ((ev: MessageEvent) => any) | null;
    onopen: ((ev: Event) => any) | null;
}

export class WS {

    private _requiresHop?: boolean;
    private _socket?: WebSocket;
    private _handlers: SocketHandlers;

    constructor() {
        this._handlers = { onopen: null, onclose: null, onerror: null, onmessage: null };
    }

    get state(): State {
        return this._socket?.readyState || State.closed;
    }

    get bufferedAmount(): number {
        return this._socket?.bufferedAmount || 0;
    }

    private _addHop(data: Uint8Array): Uint8Array {
        const c = new Uint8Array(4 + data.length);
        c.set([0, 0, 0, 1], 0);
        c.set(data, 4);
        return c;
    }

    connect(url: string, protocol: Protocol): WS {
        const s = new WebSocket(url, [protocol]);
        s.binaryType = 'arraybuffer';
        s.onopen = this._socket && this._socket.onopen || this._handlers.onopen;
        s.onclose = this._socket && this._socket.onclose || this._handlers.onclose;
        s.onmessage = this._socket && this._socket.onmessage || this._handlers.onmessage;
        s.onerror = this._socket && this._socket.onerror || this._handlers.onerror;
        this._requiresHop = protocol == Protocol.pair1;
        this._socket = s;
        return this;
    }

    onopen(handler: ((ev: Event) => any) | null): WS {
        this._handlers.onopen = handler;
        if (this._socket) this._socket.onopen = handler;
        return this;
    }

    onclose(handler: ((ev: CloseEvent) => any) | null): WS {
        this._handlers.onclose = handler;
        if (this._socket) this._socket.onclose = handler;
        return this;
    }

    onerror(handler: ((ev: Event) => any) | null): WS {
        this._handlers.onerror = handler;
        if (this._socket) this._socket.onerror = handler;
        return this;
    }

    onmessage(handler: ((ev: Uint8Array) => any) | null): WS {
        this._handlers.onmessage = (e: MessageEvent) => {
            let data = new Uint8Array(e.data);
            if (this._requiresHop) data = data.subarray(4);
            return handler?.(data);
        };
        if (this._socket) this._socket.onmessage = this._handlers.onmessage;
        return this;
    }

    send(data: Uint8Array): WS {
        if (this._requiresHop) data = this._addHop(data);
        this._socket?.send(data);
        return this;
    }

    close(): WS {
        this._socket?.close();
        return this;
    }
}