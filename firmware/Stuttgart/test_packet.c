#include <stdio.h>
#include <string.h>
#include "packet.h"
#include "crc16.h"

/*

    gcc -o test/test_packet test_packet.c packet.c crc16.c
    ./test_packet

*/

static void print_hex(const uint8_t *buf, size_t len) {
    for (size_t i = 0; i < len; i++) printf("%02X ", buf[i]);
    printf("\n");
}

int main(void) {
    int failures = 0;

    uint8_t buf[PKT_DEBUG_LOG_MAX_LENGTH];
    uint64_t timestamp = 0x0123456789ABCDEFULL;
    const char *msg = "CAN: SPI timeout";
    uint8_t msg_len = (uint8_t)strlen(msg);

    size_t frame_len = pack_debug_log(buf, timestamp, DEBUG_LOG_LEVEL_WARN, msg, msg_len);

    printf("Frame (%zu bytes): ", frame_len);
    print_hex(buf, frame_len);

    // --- Expected total length: 4 header + (8+1+msg_len) payload + 2 CRC
    size_t expected_len = 4 + (8 + 1 + msg_len) + 2;
    if (frame_len != expected_len) {
        printf("FAIL: frame_len = %zu, expected %zu\n", frame_len, expected_len);
        failures++;
    }

    // --- Header checks ---
    if (buf[0] != PKT_SYNC) { printf("FAIL: SYNC = 0x%02X, expected 0x%02X\n", buf[0], PKT_SYNC); failures++; }
    if (buf[1] != PKT_TYPE_DEBUG_LOG) { printf("FAIL: TYPE = 0x%02X, expected 0x%02X\n", buf[1], PKT_TYPE_DEBUG_LOG); failures++; }
    uint8_t expected_payload_len = 8 + 1 + msg_len;
    if (buf[2] != expected_payload_len) { printf("FAIL: LENGTH = %u, expected %u\n", buf[2], expected_payload_len); failures++; }
    // buf[3] is SEQ -- first call from a fresh process, so expect 0
    if (buf[3] != 0) { printf("FAIL: SEQ = %u, expected 0 (first call)\n", buf[3]); failures++; }

    // --- Payload: TIMESTAMP, little-endian, byte 0 = LSB ---
    for (int b = 0; b < 8; b++) {
        uint8_t expected_byte = (uint8_t)(timestamp >> (8 * b));
        uint8_t actual_byte = buf[4 + b];
        if (actual_byte != expected_byte) {
            printf("FAIL: TIMESTAMP byte %d = 0x%02X, expected 0x%02X\n", b, actual_byte, expected_byte);
            failures++;
        }
    }

    // --- Payload: LEVEL ---
    if (buf[12] != DEBUG_LOG_LEVEL_WARN) {
        printf("FAIL: LEVEL = %u, expected %u\n", buf[12], DEBUG_LOG_LEVEL_WARN);
        failures++;
    }

    // --- Payload: MESSAGE ---
    if (memcmp(&buf[13], msg, msg_len) != 0) {
        printf("FAIL: MESSAGE bytes don't match input string\n");
        failures++;
    }

    // --- CRC: independently recompute over TYPE..PAYLOAD (buf[1] through
    // buf[frame_len-3]), i.e. everything except SYNC and the CRC itself,
    // per spec §2 -- this is the actual scope check.
    size_t crc_scope_len = frame_len - 1 /*SYNC*/ - 2 /*CRC*/;
    uint16_t expected_crc = crc16_ccitt_false(&buf[1], crc_scope_len);
    uint16_t actual_crc = buf[frame_len - 2] | (buf[frame_len - 1] << 8); // little-endian
    if (actual_crc != expected_crc) {
        printf("FAIL: CRC = 0x%04X, expected 0x%04X\n", actual_crc, expected_crc);
        failures++;
    }

    // --- SEQ increments per call, doesn't reset ---
    size_t frame2_len = pack_debug_log(buf, timestamp, DEBUG_LOG_LEVEL_INFO, "x", 1);
    if (buf[3] != 1) {
        printf("FAIL: SEQ on second call = %u, expected 1\n", buf[3]);
        failures++;
    }
    (void)frame2_len;

    // --- Reject oversize message (>246 bytes) ---
    uint8_t big_msg[250];
    memset(big_msg, 'x', sizeof(big_msg));
    size_t rejected = pack_debug_log(buf, timestamp, DEBUG_LOG_LEVEL_ERROR, (char*)big_msg, 247);
    if (rejected != 0) {
        printf("FAIL: message_len=247 should be rejected (returned 0), got %zu\n", rejected);
        failures++;
    }

    if (failures == 0) {
        printf("ALL PASS\n");
        return 0;
    } else {
        printf("%d FAILURE(S)\n", failures);
        return 1;
    }
}