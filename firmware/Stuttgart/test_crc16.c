#include <stdio.h>
#include <string.h>
#include "crc16.h"

/*

    gcc -o test/test_crc16 test_crc16.c crc16.c
    ./test_crc16

*/

int main(void) {
    const char *vector = "123456789";
    uint16_t expected = 0x29B1;

    uint16_t result = crc16_ccitt_false((const uint8_t *)vector, strlen(vector));

    printf("Input:    \"%s\"\n", vector);
    printf("Expected: 0x%04X\n", expected);
    printf("Got:      0x%04X\n", result);

    if (result == expected) {
        printf("PASS\n");
        return 0;
    } else {
        printf("FAIL\n");
        return 1;
    }
}