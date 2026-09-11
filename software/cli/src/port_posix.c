/* port_posix.c - termios serial backend for macOS and Linux */

#define _DARWIN_C_SOURCE    /* macOS: exposes cfmakeraw, CRTSCTS */
#define _DEFAULT_SOURCE     /* glibc: same */

#include "port.h"

#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <termios.h>
#include <unistd.h>

struct stg_port {
    int fd;
};

stg_port *stg_port_open(const char *name, char *err, size_t errlen) {

    struct termios tio;
    stg_port *p;

    int fd = open(name, O_RDWR | O_NOCTTY | O_NONBLOCK);
    if (fd < 0) {
        if (err) snprintf(err, errlen, "open %s: %s", name, strerror(errno));
        return NULL;
    }

    /* Opened non-blocking so the call could not stall on carrier detect
     * Reads should block, so clear the flag now. */
    if (fcntl(fd, F_SETFL, 0) < 0) {
        if (err) snprintf(err, errlen, "fcntl: %s", strerror(errno));
        goto fail;
    }

    if (tcgetattr(fd, &tio) < 0) {
        if (err) snprintf(err, errlen, "tcgetattr: %s", strerror(errno));
        goto fail;
    }

    cfmakeraw(&tio);

    tio.c_cflag |= (CLOCAL | CREAD);
    tio.c_cflag &= (unsigned)~CRTSCTS;

    tio.c_cc[VMIN] = 0;     /* return with whatever has arrived */
    tio.c_cc[VTIME] = 1;    /* after at most 100 ms */

    /* Ignored by USB CDC, but termios still requires valid rates */
    cfsetispeed(&tio, B115200);
    cfsetospeed(&tio, B115200);

    if (tcsetattr(fd, TCSANOW, &tio) < 0) {
        if (err) snprintf(err, errlen, "tcsetattr: %s", strerror(errno));
        goto fail;
    }

    tcflush(fd, TCIOFLUSH);

    p = calloc(1, sizeof(*p));
    if (p == NULL) {
        if (err) snprintf(err, errlen, "out of memory");
        goto fail;
    }

    p->fd = fd;
    return p;

fail:
    close(fd);
    return NULL;

}

void stg_port_close(stg_port *p) {
    if (p == NULL) return;
    close(p->fd);
    free(p);
}

int stg_port_read(stg_port *p, uint8_t *buf, size_t len) {
    ssize_t n = read(p->fd, buf, len);
    if (n < 0) {
        if (errno == EINTR || errno == EAGAIN) return 0;
        return -1;
    }
    return (int)n;
}