#pragma once
#include <stdint.h>
#include <stddef.h>

// CRC16/CCITT-FALSE
// poly=0x1021, init=0xFFFF, RefIn=false, RefOut=false, XorOut=0x0000
// Check Value: crc16_ccitt_false(bytes of "123456789") === 0x29B1
uint16_t crc16_ccitt_false(const uint8_t *data, size_t len);