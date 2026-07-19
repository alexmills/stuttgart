// MAIN THREAD

import { store } from '../store.js'

const worker = new Worker('./serialWorker.js', {type: 'module'})

worker.onmessage = (e) => {

    const msg = e.data

    switch (msg.type) {

        case 'connected':
            store.set({ serialConnected: true, serialConnecting: false, serialError: null })
            break;
        
        case 'disconnected':
            store.set({ serialConnected: false })
            break;

        case 'error':
            store.set({ serialConnected: false, serialConnecting: false, serialError: msg.message })

        case 'packet':
            // Placeholder until packet decoder is in
            console.log('packet:', msg.packet)
            break;

    }

}

export async function connect() {

    store.set({ serialConnecting: true, serialError: null })

    try {
        await navigator.serial.requestPort()
        worker.postMessage({ type: 'connect' })
    } catch (err) {
        store.set({ serialConnecting: false, serialError: err.message })
    }

}