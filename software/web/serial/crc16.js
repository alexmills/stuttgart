// CRC16/CCITT-FALSE
// poly=0x1021, init=0xFFFF, RefIn=false, RefOut=false, XorOut=0x0000
// Check Value: crc16CcittFalse(bytes of "123456789") === 0x29B1

export function crc16CcittFalse(bytes) {

    let crc = 0xFFFF

    for (let i = 0; i < bytes.length; i++) {

        crc ^= bytes[i] << 8

        for (let bit = 0; bit < 8; bit++) {
            crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1)
            crc &= 0xFFFF
        }

    }

    return crc;

}