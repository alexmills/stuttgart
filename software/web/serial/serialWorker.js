import { PacketParser } from "./packetParser.js"
import { openDb, writeBatch } from "./db.js"
import {
    decodeCanFrame,
    decodeBusState,
    decodeDeviceStatus,
    decodeVoltageSample
} from "./payloadDecoders.js"
import { 
    MSG,
    ErrorCategory,
    loadedMsg,
    connectedMsg,
    disconnectedMsg,
    errorMsg,
    liveMsg,
    cmdResponseMsg
} from "./workerMessages.js"


// All supported Stuttgart Packet Types
const PACKET_TYPES = {
    0x01: 'CAN_FRAME',
    0x02: 'VOLTAGE_SAMPLE',
    0x03: 'BUS_STATE',
    0x04: 'CMD_RESPONSE',
    0x05: 'DEVICE_STATUS'
}

// Hybrid flush trigger - whichever limit hits first
const FLUSH_INTERVAL_MS = 200
const FLUSH_MAX_BATCH = 500

let pendingRecords = []
let flushTimer = null

/*

    IndexedDB Persistance

*/

// Warm connection to DB
openDb().catch((err) => {
    self.postMessage(errorMsg(ErrorCategory.STORAGE, `Failed to open database: ${err.message}`))
})

function queueForPresistance(packetType, seq, decoded) {

    pendingRecords.push({
        packetType,
        seq,
        timestamp: decoded.timestamp,
        data: decoded
    })

    if (pendingRecords.length >= FLUSH_MAX_BATCH) {
        flush()
    } else if (!flushTimer) {
        flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS)
    }

}

async function flush() {
    clearTimeout(flushTimer)
    flushTimer = null

    if (pendingRecords.length === 0) {
        return
    }

    const batch = pendingRecords
    pendingRecords = []

    try {
        await writeBatch(batch)
    } catch (err) {
        self.postMessage(errorMsg(ErrorCategory.STORAGE, `DB write failed: ${err.message}`))
    }
}

/*

    Packet Parsing

*/

const parser = new PacketParser(({ type, seq, payload }) => {

    const name = PACKET_TYPES[type]
    if (!name) {
        return
    }

    switch (name) {
        case 'CAN_FRAME':
            // Persisted Only - High volume, not needed reactively
            queueForPresistance(name, seq, decodeCanFrame(payload))
            break;

        case 'VOLTAGE_SAMPLE': {
            const decoded = decodeVoltageSample(payload)
            queueForPresistance(name, seq, decoded)
            self.postMessage(liveMsg(name,seq,decoded))
            break;
        }

        case 'BUS_STATE': {
            const decoded = decodeBusState(payload)
            queueForPresistance(name, seq, decoded)
            self.postMessage(liveMsg(name,seq,decoded))
            break;
        }

        case 'DEVICE_STATUS': {
            const decoded = decodeDeviceStatus(payload)
            queueForPresistance(name, seq, decoded)
            self.postMessage(liveMsg(name,seq,decoded))
            break;
        }

        case 'CMD_RESPONSE':
            // Not persisted - live request/response correlation only
            self.postMessage(cmdResponseMsg(seq, payload))
            break;
    }

})

/*

    Serial Connection

*/

// Guard agaisnt overlapping connect attempts
let connectionActive = false

async function readLoop(port) {
    while(port.readable) {
        const reader = port.readable.getReader()

        try {
            while(true) {

                const { value, done } = await reader.read()
                
                // Reader has been cancelled
                if (done) {    
                    break;
                }

                // Parse supplied chunk of data
                parser.push(value)

            }
        } catch (err) {
            self.postMessage(errorMsg(ErrorCategory.CONNECTION, err.message))
        } finally {
            reader.releaseLock()
        }
    }

    // Don't lose pending records when the connection ends
    await flush() 
    self.postMessage(disconnectedMsg())
}

async function handleConnect() {

    if (connectionActive) {
        self.postMessage(errorMsg(ErrorCategory.CONNECTION, 'Connection already in progress or open.'))
        return true
    }

    connectionActive = true

    try {

        const ports = await navigator.serial.getPorts()
        const port = ports[ports.length - 1]

        if (!port) {
            self.postMessage(errorMsg(ErrorCategory.CONNECTION, 'No authorized port found.'))
            return
        }

        await port.open({ baudeRate: 115200 })
        self.postMessage(connectedMsg())

        // Start reading data from the port
        await readLoop(port)

    } catch (err) {
        self.postMessage(errorMsg(ErrorCategory.CONNECTION, err.message))
    } finally {
        // Released once the whole connection lifecycle ends
        connectionActive = false
    }

}

self.onmessage = async (e) => {

    switch(e.data.type) {
        case 'connect':
            handleConnect()
            break;
    }

}

self.postMessage(loadedMsg())