/* stg_proto.c - Stuttgart packet framing, CRC and TLV decoding 
 *
 * This file is intended to compile unchanged into the firmware as
 * well as the cli client 
 */


#include "stg_proto.h"

#include <string.h>

void stg_framer_init(stg_framer *f) {
    f->used = 0;
}

size_t stg_framer_feed(stg_framer *f, const uint8_t *data, size_t len) {

    size_t space = sizeof f->buf - f->used;
    if (len > space) len = space;

    memcpy(f->buf + f->used, data, len);
    f->used += len;

    return len;

}

/* Remove the first n bytes from the buffer */
static void discard(stg_framer *f, size_t n) {

    if (n >= f->used) {
        f->used = 0;
        return;
    }

    memmove(f->buf, f->buf + n, f->used - n);
    f->used -= n;

}

int stg_framer_next(stg_framer *f, stg_frame *out) {
    for (;;) {

        /* 1. Need at least a header before anything can be decided */
        if (f->used < STG_HEADER_LEN) {
            return 0;
        }

        /* 2. Find the sync pattern */
        size_t i = 0;
        while (i + 1 < f->used && !(f->buf[i] == STG_SYNC0 && f->buf[i + 1] == STG_SYNC1)) {
            i++;
        }

        if (i + 1 >= f->used) {
            /* No sync found. keep the final byte: it may be the first 
             * half of a pair split across two reads */
            discard(f, f->used - 1);
            return 0;
        }

        if (i > 0) {
            discard(f, i);
            continue;
        }

        /* 3. Sync is at offset 0. Read the declared payload length */
        uint16_t len = (uint16_t)(f->buf[2] | ((uint16_t)f->buf[3] << 8));

        if (len > STG_MAX_PAYLOAD) {
            /* False sync: a real frame may begin inside this region, so
             * step forward one byte only */
            discard(f,1);
            continue;
        }

        size_t total = STG_HEADER_LEN + len + 2;

        /* 4. Wait for the rest to arrive */
        if (f->used < total) {
            return 0;
        }

        /* 5. Verify. The CRC covers len, type, seq, and payload,
         * butnot the sync bytes. */
        uint16_t want = stg_crc16(f->buf + 2, (size_t)(len + 4));
        uint16_t got = (uint16_t)(f->buf[total - 2] | ((uint16_t)f->buf[total - 1] << 8));

        if (want != got) {
            discard(f,1);
            continue;
        }

        /* Good Frame. */
        out->len = len;
        out->type = f->buf[4];
        out->seq = f->buf[5];
        out->payload = f->buf + STG_HEADER_LEN;

        discard(f,total);
        return 1;

    }
}

uint16_t stg_crc16(const uint8_t *data, size_t len) {

    uint16_t crc = 0xFFFF;

    for (size_t i = 0; i < len; i++) {
        crc ^= (uint16_t)data[i] << 8;

        for (int bit = 0; bit < 8; bit++) {
            if (crc & 0x8000) {
                crc = (uint16_t)((crc << 1) ^ 0x1021);
            } else {
                crc = (uint16_t)(crc << 1);
            }
        }
    }

    return crc;

}