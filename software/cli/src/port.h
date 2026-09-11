#ifndef STG_PORT_H
#define STG_PORT_H

#include <stddef.h>
#include <stdint.h>

typedef struct stg_port stg_port;

stg_port *stg_port_open(const char *name, char *err, size_t errlen);
int stg_port_read(stg_port *p, uint8_t *buf, size_t len);
int stg_port_write(stg_port *p, const uint8_t *buf, size_t len);
void stg_port_close(stg_port *p);

#endif /* STG_PORT_H */