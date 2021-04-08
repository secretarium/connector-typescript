import msrCrypto from '../vendor/msrCrypto';

const selectCrypto = () => {
    const windowCrypto = typeof window !== 'undefined' ? window.crypto : undefined;
    return windowCrypto || msrCrypto;
};

export default selectCrypto();