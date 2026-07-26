/*

    Main Thread to Worker

*/

export const ClientMsg = Object.freeze({
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
})

export const connectMsg = () => ({
    type: ClientMsg.CONNECT
})

export const disconnectMsg = () => ({
    type: ClientMsg.DISCONNECT
})

/*

    Worker to Main Thread

*/

export const WorkerMsg = Object.freeze({
    LOADED: 'loaded',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
    LIVE: 'live',
    CMD_RESPONSE: 'cmdResponse'
})

export const ErrorCategory = Object.freeze({
    CONNECTION: 'connection',   // Serial Link Connection / Read Errors
    STORAGE: 'storage'          // IndexedDB open / write failures
})

// One factory per message shape

export const loadedMsg = () => ({
    type: WorkerMsg.LOADED
})

export const connectedMsg = () => ({ 
    type: WorkerMsg.CONNECTED 
})

export const disconnectedMsg = () => ({
    type: WorkerMsg.DISCONNECTED
})

export const errorMsg = (category, message) => ({
    type: WorkerMsg.ERROR,
    category,
    message
})

export const liveMsg = (packetType, seq, data) => ({
    type: WorkerMsg.LIVE,
    packetType,
    seq,
    data
})

export const cmdResponseMsg = (seq,payload) => ({
    type: WorkerMsg.CMD_RESPONSE,
    seq,
    payload
})