#include "packet.h"
#include "crc16.h"
#include <string.h>

// Rolling per-type SEQ counters
static uint8_t seq_debug_log = 0;

size_t pack_debug_log(uint8_t *buf, uint64_t timestamp_us, debug_log_level_t level, const char *message, uint8_t message_len) {
        
    if (message_len >246) {
        return 0;
    }

    uint8_t payload_len = 8 + 1 + message_len; // TIMESTAMP + LEVEL + MESSAGE

    size_t i = 0;

    // --- Header ---
    buf[i++] = PKT_SYNC;
    buf[i++] = PKT_TYPE_DEBUG_LOG;
    buf[i++] = payload_len;
    buf[i++] = seq_debug_log++;

    // --- TIMESTAMP (8B LE) ---
    for (int b = 0; b < 8; b++) {
        buf[i++] = (uint8_t)(timestamp_us >> (8 * b));
    }

    // --- LEVEL ---
    buf[i++] = (uint8_t)level;

    // --- MESSAGE ---
    memcpy(&buf[i], message, message_len);
    i += message_len;

    // CRC16 over TYPE|LENGTH|SEQ|PAYLOAD
    uint16_t crc = crc16_ccitt_false(&buf[1], i - 1);
    buf[i++] = (uint8_t)(crc & 0xFF);   // Little-endian
    buf[i++] = (uint8_t)(crc >> 8);

    return i;
    
}