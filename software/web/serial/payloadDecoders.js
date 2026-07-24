
/*

    CAN Data Length Code
    --------------------

    DLC: 4-bit code as transmitted and what it decodes to depends
    on the CAN 

    In Classic CAN, this is the raw number of bytes to be expected
    by the receiver (0-8). Anything over 8, is seen as a fault as it should
    never happen.

    CAN FD defines a non-linear step above 8 (12,16,20,24,32,48,66) that is
    a fixed mapping from the frame format itself (ISO 11898-1)

    DLC     Bytes (Classic)     Bytes (CAN-FD)
    ------------------------------------------
    0-8     0-8                 0-8
    9-15    8 (capped)          12,16,20,24,32,48,64

*/

const DLC_FD_TABLE = [0,1,2,3,4,5,6,7,8,12,16,20,24,32,48,64];

function decodeDlc(dlcRaw, isFD) {

    if (dlcRaw <= 8) {
        return dlcRaw
    }

    return isFD ? DLC_FD_TABLE[dlcRaw] : 8

}

/*

    CAN Bus Frame
    -------------

    Field           Size    Notes
    ------------------------------------------------------------------------------------------
    ARBITRATION_ID  4B      uint32, 11-bit or 29-bit depending on IDE Flag
    FLAGS           1B      bit0 IDE, bit1 RTR, bit2 FDF (CAN FD), bit3 BRS, bits 5-7 Reserved
    DLC             1B      Raw DLC
    TIMESTAMP       4B      uint32, us
    DATA            0-64B   Length from decoded DLC


*/

export function decodeCanFrame(payload) {

    const dv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)

    const arbId = dv.getUint32(0, true)
    const flags = dv.getUint8(4)
    const dlcRaw = dv.getUint8(5)
    const timestamp = dv.getUint32(6, true)

    const isRtr = !!(flags & 0x02)
    const isFD = !!(flags & 0x04)
    const dataLen = isRtr ? 0 : decodeDlc(dlcRaw, isFD)

    return {
        timestamp,
        arbId,
        flags,
        dlcRaw,
        isRtr,
        isFD,
        data: payload.slice(10, 10 + dataLen)
    }

}

/*

    Voltage Sample
    --------------

    Field       Size    Notes
    -------------------------------------------------------
    TIMESTAMP   4B      unit32, us
    CANH_RAW    2B      uint16, 0-4095
    CANL_RAW    2B      uint16, 0-4095
    FLAGS       1B      bit0 CAN H Fault, bit1 CAN L Fault

*/

export function decodeVoltageSample(payload) {

    const dv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)

    return {
        timestamp: dv.getUint32(0, true),
        canhraw: dv.getUint16(4, true),
        canlraw: dv.getUint16(6, true),
        flags: dv.getUint8(8)
    }

}

/*

    Device Status
    -------------

    Field               Size    Notes
    ---------------------------------------------------------------
    TIMESTAMP           4B      uint32, us
    UPTIME              4B      uint32, seconds
    FRAMES_DROPPED      4B      Cumulative, CAN_FRAME ring buffer
    SAMPLES_DROPPED     4B      Cumulative, VOLTAGE_SAMPLE path
    BUS_LOAD_PCT        1B      0-100, rolling window
    MSG_COUNT           4B      uint32, running total of CAN messages
    MCU_TEMP_C          1B      int8, signed RP2354A internal sensor
    RING_BUFFER_PCT     1B      0-100, current occupancy

*/

export function decodeDeviceStatus(payload) {

    const dv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)

    return {
        timestamp: dv.getUint32(0, true),
        uptime: dv.getUint32(4, true),
        framesDropeed: dv.getUint32(8, true),
        samplesDropped: dv.getUint32(12, true),
        busLoadPct: dv.getUint8(16),
        msgCount: dv.getUint32(17, true),
        mcuTempC: dv.getInt8(21),
        ringBufferPct: dv.getUint8(22)
    }

}

/*

    Bus State
    ---------

    Field       Size    Notes
    ---------------------------------------------------------
    TIMESTAMP   4B      uint32, us
    EVENT_TYPE  1B      see below
    EVENT_DATA  varies  Depends on EVENT_TYPE

    EVENT_TYPE              EVENT_DATA
    ---------------------------------------------------------
    0x01 NETWORK_DETECTED   1B: 0=J1939, 1=J2284
    0x02 NODE_DISCOVERED    1B Source Address + 8B NAME (J1939 Address Claimed)
    0x03 ADDRESS_CONFLICT   1B Conflicting Address
    0x04 VOLTAGE_FAULT      1B Channel (0=CANH,1=CANL) + 2B raw ADC Value
    0x05 ERROR_COUNTER      1B TEC + 1B REC
    0x06 DIAG_FLAGS         2B Raw copy of CiBDIAG1[31:16]


*/

export function decodeBusState(payload) {

    const dv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)

    const timestamp = dv.getUint32(0, true)
    const eventType = dv.getUint8(4)
    const eventOffset = 5

    let event

    switch (eventType) {
        case 0x01:  // NETWORK_DETECTED
            event = {
                type: 'NETWORK_DETECTED',
                network: dv.getUint8(eventOffset) === 0 ? 'J1939' : 'J2284' 
            }
            break;

        case 0x02:  // NODE_DISCOVERED
            event = {
                type: 'NODE_DISCOVERED',
                sourceAddress: dv.getUint8(eventOffset),
                name: payload.slice(eventOffset + 1, eventOffset + 9) // 8B NAME, raw
            }
            break;

        case 0x03:  // ADDRESS_CONFLICT
            event = {
                type: 'ADDRESS_CONFLICT',
                conflictingAddress: dv.getUint8(eventOffset)
            }
            break;

        case 0x04: // VOLTAGE_FAULT
            event = {
                type: 'VOLTAGE_FAULT',
                channel: dv.getUint8(eventOffset) === 0 ? 'CANH' : 'CANL',
                rawAdc: dv.getUint16(eventOffset + 1, true)
            }
            break;

        case 0x05: // ERROR_COUNTER
            event = {
                type: 'ERROR_COUNTER',
                tec: dv.getUint8(eventOffset),
                rec: dv.getUint8(eventOffset + 1)
            }
            break;

        case 0x06: // DIAG_FLAGS
            event = {
                type: 'DIAG_FLAGS',
                flags: dv.getUint16(eventOffset, true)
            }
            break;

        default:
            event = { 
                type: 'UNKOWN',
                raw: payload.slice(eventOffset)
            }
    }

    return { timestamp, eventType, ...event }

}

