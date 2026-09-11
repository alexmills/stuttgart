#ifndef STG_PROTO_H
#define STG_PROTO_H

#include <stddef.h>
#include <stdint.h>

#define STG_MAX_PAYLOAD 1024
#define STG_HEADER_LEN 6
#define STG_FRAME_MAX (STG_HEADER_LEN + STG_MAX_PAYLOAD + 2)

#define STG_SYNC0 0xA5
#define STG_SYNC1 0x5A

typedef struct {
    uint8_t type;
    uint8_t seq;
    uint16_t len;
    const uint8_t *payload; /* Points into the framers buffer */
} stg_frame;

typedef struct {
    uint8_t buf[STG_FRAME_MAX];
    size_t used;
} stg_framer;

void stg_framer_init(stg_framer *f);
size_t stg_framer_feed(stg_framer *f, const uint8_t *data, size_t len);
int stg_framer_next(stg_framer *f, stg_frame *out);

/* CRC-16/CCITT-FALSE. Polynominal 0x1021, init 0xFFFF, no reflection,
 * no final XOR. Check value for "123456789" is 0x29B1 */
uint16_t stg_crc16(const uint8_t *data, size_t len);

#endif