#include "crc16.h"

// CRC16/CCITT-FALSE

// poly=0x1021, init=0xFFFF, RefIn=false, RefOut=false, XorOut=0x0000
// Check Value: crc16_ccitt_false(bytes of "123456789") === 0x29B1
uint16_t crc16_ccitt_false(const uint8_t *data, size_t len) {
    
    uint16_t crc = 0xFFFF;

    for (size_t i = 0; i < len; i++) {

        crc ^= (uint16_t)data[i] << 8;

        for (int bit = 0; bit < 8; bit++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : (crc << 1);
        }

    }

    return crc;

}