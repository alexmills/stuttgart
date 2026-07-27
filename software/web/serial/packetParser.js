import { crc16CcittFalse } from "./crc16.js"


/*

    Stuttgart Packet
    ----------------
    All packets, either direction, share same structure
    4 Byte header, type-specific payload, and a 2 Byte CRC trailer

    Multi-byte Field Order: Little-Endian (least significant byte first)

    Field   Size        Part    Notes
    ---------------------------------------------------------------
    SYNC    1B          Header  0xAA
    TYPE    1B          Header  Packet Type
    LENGTH  1B          Header  Payload length in bytes (0-255)
    SEQ     1B          Header  Rolling 0-255 counter, PER TYPE
    PAYLOAD LENGTH B    Payload Type smuspecific
    CRC16   2B          Trailer CRC-16/CCITT-FALSE over TYPE|LENGTH|SEQ|PAYLOAD

*/


const SYNC = 0xAA
const HEADER_LEN = 4    // SYNC + TYPE + LENGTH + SEQ
const CRC_LEN = 2

export class PacketParser {

    constructor(onPacket) {
        
        // Unprocessed bytes carried between push() calls
        this.buffer = new Uint8Array(0)

        // Called once per verified packet: ({type, seq, payload}) => void
        this.onPacket = onPacket

    }

    push(chunk) {
        this.buffer = concat(this.buffer, chunk)
        this._drain()
    }

    _drain() {

        // Loop over the buffer as it may contain multiple packets
        // delivered at once from USB

        while (true) {

            // Check for SYNC byte
            const syncIndex = this.buffer.indexOf(SYNC)

            // SYNC byte not present - data is just noise
            if (syncIndex === -1) {
                this.buffer = new Uint8Array(0)
                return
            }

            // Discard everything before SYNC byte
            if (syncIndex > 0) {
                this.buffer = this.buffer.slice(syncIndex)
            }

            // Not enough bytes for Header yet
            if (this.buffer.length < HEADER_LEN) {
                return
            }

            // Read TYPE, LENGTH and SEQ from fixed header offsets
            const type = this.buffer[1]
            const length = this.buffer[2]
            const seq = this.buffer[3]

            // Calculate total length of packet including PAYLOAD length
            const totalLen = HEADER_LEN + length + CRC_LEN

            // Not enough bytes for full packet yet
            if (this.buffer.length < totalLen) {
                return
            }

            // Get payload from buffer
            const payload = this.buffer.slice(HEADER_LEN, HEADER_LEN + length)

            // Get the region used for CRC
            const crcRegion = this.buffer.slice(1, HEADER_LEN + length) // TYPE||LENGTH||SEQ||PAYLOAD

            // Get and parse CRC as little-endian
            const crcBytes = this.buffer.slice(HEADER_LEN + length, totalLen)
            const receivedCrc = crcBytes[0] | (crcBytes[1] << 8)  // little-endian
            
            // Compute CRC and compare with supplied
            if (receivedCrc === crc16CcittFalse(crcRegion)) {
                this.onPacket({ type, seq, payload })
                this.buffer = this.buffer.slice(totalLen)
            } else {
                // Something is wrong, either the SYNC byte is not the SYNC byte
                // or the data is corrupt, either way we safely assume the first
                // byte at the fron is not a valid packet start.
                this.buffer = this.buffer.slice(1)
            }

        }
    }
 
}

function concat(a, b) {
    const merged = new Uint8Array(a.length + b.length)
    merged.set(a)
    merged.set(b, a.length)
    return merged
}