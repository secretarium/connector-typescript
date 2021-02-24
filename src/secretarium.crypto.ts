import msrCrypto from '../vendor/msrCrypto';

const selectCrypto = () => {
    const finalCrypto = window.crypto || msrCrypto;
    return finalCrypto;
};

export default selectCrypto();