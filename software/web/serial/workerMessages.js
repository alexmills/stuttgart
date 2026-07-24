export const MSG = Object.freeze({
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

export const connectedMsg = () => ({ 
    type: MSG.CONNECTED 
})

export const disconnectedMsg = () => ({
    type: MSG.DISCONNECTED
})

export const errorMsg = (category, message) => ({
    type: MSG.ERROR,
    category,
    message
})

export const liveMsg = (packetType, seq, data) => ({
    type: MSG.LIVE,
    packetType,
    seq,
    data
})

export const cmdResponseMsg = (seq,payload) => ({
    type: MSG.CMD_RESPONSE,
    seq,
    payload
})