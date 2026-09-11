#include <stdio.h>
#include "port.h"

#define STG_VERSION "0.1.1"

int main(int argc, char **argv) {

    // Always print version number
    printf("Stuttgart %s\n", STG_VERSION);
    
    if (argc < 2) {
        fprintf(stderr, "usage: %s <port>\n", argv[0]);
        return 1;
    }

    char err[256];
    stg_port *p = stg_port_open(argv[1], err, sizeof err);
    if (p == NULL) {
        fprintf(stderr, "%s\n", err);
        return 1;
    }

    printf("opened %s\n", argv[1]);

    uint8_t buf[256];
    for (;;) {
        
        int n = stg_port_read(p, buf, sizeof buf);
        
        if (n < 0) {
            fprintf(stderr, "read error\n");
            break;
        }

        for (int i = 0; i < n; i++) {
            printf("%02X ", buf[i]);
        }

        if (n > 0) fflush(stdout);
    }

    stg_port_close(p);
    return 0;
}

