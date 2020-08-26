import * as SecretariumHandle from './index';

test('Exports the right shape', () => {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BaseHandle: any = SecretariumHandle;

    expect(BaseHandle.default).toBeUndefined();
    expect(BaseHandle.SCP).toBeDefined();
    expect(BaseHandle.KeysManager).toBeDefined();
    expect(BaseHandle.NotifState).toBeDefined();
    expect(BaseHandle.Utils).toBeDefined();
    expect(BaseHandle.Constants).toBeDefined();
    expect(BaseHandle.Compatibility).toBeDefined();
});