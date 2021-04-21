import ws from 'ws';

const selectSocket = () => {
    const nativeSocket = typeof WebSocket !== 'undefined' ? WebSocket : undefined;
    return nativeSocket || ws;
};

export default selectSocket();