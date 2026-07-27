// MAIN THREAD

import { store } from '../store.js'
import { appLog } from '../appLog.js'
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
            handleBusStateEvent(msg.data)
            break;
        }
    }

}

function handleBusStateEvent(event) {

    const state = store.get()
    const patch = { busStateEvents: [...state.busStateEvents, event]}

    if (event.type === 'ERROR_COUNTER') {
        patch.busErrorCountersLatest = event
    }

    else if (event.type === 'DIAG_FLAGS') {
        patch.busDiagFlagsLatest = event
    }

    store.set(patch)

}

function handleError(msg) {

    switch (msg.category) {

        case ErrorCategory.CONNECTION:
            store.set({ serialConnected: false, serialConnecting: false, serialError: msg.message })
            appLog.error(`Serial Error: ${msg.message}`)
            break;

        case ErrorCategory.STORAGE:
            store.set({ storageError: msg.message })
            appLog.error(`Storage Error: ${msg.message}`)
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
            appLog.info("Worker Thread Loaded")
            break;

        case WorkerMsg.CONNECTED:
            appLog.info("Serial Port Connected")
            store.set({ serialConnected: true, serialConnecting: false, serialError: null })
            break;
        
        case WorkerMsg.DISCONNECTED:
            appLog.info("Serial Port Disconnected")
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
            appLog.warn(`Unhandled worker message: ${msg.type}`)

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