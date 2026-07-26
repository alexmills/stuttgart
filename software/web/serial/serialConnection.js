// MAIN THREAD

import { store } from '../store.js'
import { 
    WorkerMsg,
    ErrorCategory,
    connectMsg,
    disconnectMsg
} from './workerMessages.js'

/*

    Worker Support

*/

const worker = new Worker(
    new URL('./serialWorker.js', import.meta.url),
    {type: 'module'}
)

worker.onmessage = (e) => {

    const msg = e.data

    switch (msg.type) {

        case WorkerMsg.LOADED:
            console.log("Worker Loaded")
            break;

        case WorkerMsg.CONNECTED:
            store.set({ serialConnected: true, serialConnecting: false, serialError: null })
            break;
        
        case WorkerMsg.DISCONNECTED:
            store.set({ serialConnected: false })
            break;

        case WorkerMsg.ERROR:
            // PLACEHOLDER - Handle errors nicer...
            if (msg.category === ErrorCategory.CONNECTION) {
                store.set({ serialConnected: false, serialConnecting: false, serialError: msg.message })
            } else if (msg.category === ErrorCategory.STORAGE) {
                store.set({ storageError: msg.message })
            }
            break;

        case WorkerMsg.LIVE:
            // PLACEHOLDER
            console.log('live:', msg.packetType, msg.data)
            break;

        case WorkerMsg.CMD_RESPONSE:
            // PLACEHOLDER
            console.log('cmd response:', msg.seq, msg.payload)
            break;

        default:
            // PLACEHOLDER
            console.log('unhandled worker message', msg.type)

    }

}

/*

    Serial Connection

*/

export async function connect() {

    store.set({ serialConnecting: true, serialError: null })

    try {
        await navigator.serial.requestPort()
        worker.postMessage(connectMsg())
    } catch (err) {
        store.set({ serialConnecting: false, serialError: err.message })
    }

}

export function disconnect() {
    worker.postMessage(disconnectMsg())
}