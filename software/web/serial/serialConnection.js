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

function handleLiveMessage(msg) {

    switch (msg.packetType) {
        
        case 'VOLTAGE_SAMPLE':
            store.set({ voltageLatest: msg.data })
            break;

        case 'DEVICE_STATUS':
            store.set({ deviceStatusLatest: msg.data })
            break;
            
        case 'BUS_STATE': {
            const state = store.get()
            store.set({ busStateEvents: [...state.busStateEvents, msg.data]})
        }
    }

}

function handleError(msg) {

    switch (msg.category) {

        case ErrorCategory.CONNECTION:
            store.set({ serialConnected: false, serialConnecting: false, serialError: msg.message })
            break;

        case ErrorCategory.STORAGE:
            store.set({ storageError: msg.message })
            break;

    }

}

/*

    Worker

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
            handleError(msg)
            break;

        case WorkerMsg.LIVE:
            handleLiveMessage(msg)
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