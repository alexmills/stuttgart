// MAIN THREAD

import { store } from '../store.js'
import { MSG, ErrorCategory } from './workerMessages.js'

/*

    Worker Support

*/

const worker = new Worker('./serialWorker.js', {type: 'module'})

worker.onmessage = (e) => {

    const msg = e.data

    switch (msg.type) {

        case MSG.CONNECTED:
            store.set({ serialConnected: true, serialConnecting: false, serialError: null })
            break;
        
        case MSG.DISCONNECTED:
            store.set({ serialConnected: false })
            break;

        case MSG.ERROR:
            // PLACEHOLDER - Handle errors nicer...
            if (msg.category === ErrorCategory.CONNECTION) {
                store.set({ serialConnected: false, serialConnecting: false, serialError: msg.message })
            } else if (msg.category === ErrorCategory.STORAGE) {
                store.set({ storageError: msg.message })
            }
            break;

        case MSG.LIVE:
            // PLACEHOLDER
            console.log('live:', msg.packetType, msg.data)
            break;

        case MSG.CMD_RESPONSE:
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
        worker.postMessage({ type: 'connect' })
    } catch (err) {
        store.set({ serialConnecting: false, serialError: err.message })
    }

}