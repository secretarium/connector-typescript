import React, { useEffect, useState } from 'react';
import { Key, SCP, Constants } from '../../src';

const scp = new SCP();
const isDev = process.env.NODE_ENV === 'development';

const App: React.FC = () => {

    const [hasInitialisedKey, setHasInitialisedKey] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string>();
    const [key, setKey] = useState<any>();
    const [code, setCode] = useState<string>();

    useEffect(() => {
        if (!hasInitialisedKey && !key) {
            Key.createKey()
                .then((keyPair: any) => {
                    setKey(keyPair);
                })
                .catch((error: any) => {
                    setError(isDev ? `Key generation error: ${error?.message?.toString() ?? error?.toString()}` : 'Oops, a problem occured');
                    console.error(error);
                });
            setHasInitialisedKey(true);
        }
    }, [hasInitialisedKey, key]);

    useEffect(() => {
        async function connectBackend() {
            if (key && scp.state === Constants.ConnectionState.closed) {
                scp.connect('wss://ovh-uk-eri-2288-2.node.secretarium.org:443', key, 'rliD_CISqPEeYKbWYdwa-L-8oytAPvdGmbLC0KdvsH-OVMraarm1eo-q4fte0cWJ7-kmsq8wekFIJK0a83_yCg==').then(() => {
                    setIsConnected(true);
                }).catch((error) => {
                    setError(isDev ? `Connection error: ${error?.message?.toString() ?? error?.toString()}` : 'Oops, a problem occured');
                    setIsConnected(false);
                    console.error(error);
                });
            }
        }
        connectBackend();
    }, [key]);

    useEffect(() => {
        if (isConnected) {

            const query = scp.newTx('moai', 'generate-venue-id', `moai-qr-${Date.now()}`, {
                type: 0
            });
            query.onExecuted?.(() => {
                console.log('Executed');
            });
            query.onResult?.((result: any) => {
                setError(undefined);
                setCode(encodeURI(result.id));
                console.log('Result', result);
            });
            query.onError?.((error: any) => {
                setError(isDev ? `Transaction error: ${error?.message?.toString() ?? error?.toString()}` : 'Oops, a problem occured');
                setCode(undefined);
                console.error('Error', error);
                setIsConnected(false);
            });
            query.send?.()
                .catch((error) => {
                    setError(isDev ? `Transaction error: ${error?.message?.toString() ?? error?.toString()}` : 'Oops, a problem occured');
                    setCode(undefined);
                    console.error('Error', error);
                    setIsConnected(false);
                });
        }
    }, [isConnected]);

    return (
        <pre>
            Secretarium Connector -
            <br />
            {JSON.stringify(key ?? {}, null, 4)}
            <br />
            {JSON.stringify(code ?? '', null, 4)}
            <br />
            {error ?? ''}
        </pre>
    );
};

export default App;
