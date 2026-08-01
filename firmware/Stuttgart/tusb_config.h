#pragma once

#define CFG_TUSB_MCU            OPT_MCU_RP2040  //  Covers RP2350 too...
#define CFG_TUSB_OS             OPT_OS_PICO
#define CFG_TUSB_RHPORT0_MODE   OPT_MODE_DEVICE

#define CFG_TUD_ENABLED         1
#define CFG_TUD_CDC             1

// Endpoint buffer sizes - 74 bytes is the largest single packet
// 128 gives headroom without wasting too much RAM
#define CFG_TUD_CDC_RX_BUFSIZE  128
#define CFG_TUD_CDC_TX_BUFSIZE  128

// All other classes off - this is a single-interface CDC device, nothing else
#define CFG_TUD_CDC_EP_BUFSIZE  64