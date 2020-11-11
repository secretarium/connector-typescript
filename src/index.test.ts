import * as SecretariumHandle from './index';

test('Exports the right shape', () => {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BaseHandle: any = SecretariumHandle;

    expect(Object.getOwnPropertyNames(BaseHandle).sort()).toEqual([
        'Constants',
        'Key',
        'SCP',
        'Utils'
    ].sort());
});