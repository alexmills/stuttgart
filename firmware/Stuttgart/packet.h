#pragma once
#include <stdint.h>
#include <stddef.h>

#define PKT_SYNC    0xAA    // Sync Byte

// Pakcet Types
#define PKT_TYPE_DEBUG_LOG 0x06

// Header(4) + max DEBUG_LOG paylod(9+246) + CRC(2)
#define PKT_DEBUG_LOG_MAX_LENGTH 261

typedef enum {
    DEBUG_LOG_LEVEL_DEBUG = 0,
    DEBUG_LOG_LEVEL_INFO = 1,
    DEBUG_LOG_LEVEL_WARN = 2,
    DEBUG_LOG_LEVEL_ERROR = 3,
} debug_log_level_t;

// Packs a DEBUG_LOG (0x06) frame into buf. message_len must be <= 246
// Returns total frame length written or 0 if message_len exceeds the cap
size_t pack_debug_log(uint8_t *buf, uint64_t timestamp_us, debug_log_level_t level, const char *message, uint8_t message_len);

