#include "tusb.h"

// ---- Device Descriptor -------------------------------------------------
// Single-function CDC-ACM device: class/subclass/protocol declared at the
// device level (not IAD-based), since there's exactly one interface pair
// here and nothing else sharing the device. This matches how a plain 
// USB-CDC modem identifies itself.

tusb_desc_device_t const desc_device = {
    .bLength            = sizeof(tusb_desc_device_t),
    .bDescriptorType    = TUSB_DESC_DEVICE,
    .bcdUSB             = 0x0200,
    .bDeviceClass       = TUSB_CLASS_CDC,
    .bDeviceSubClass    = 0,
    .bDeviceProtocol    = 0,
    .bMaxPacketSize0    = CFG_TUD_ENDPOINT0_SIZE,

    .idVendor           = 0xCafe,
    .idProduct          = 0x4004,
    .bcdDevice          = 0x0100,   // firmware version 1.00

    .iManufacturer      = 0x01,
    .iProduct           = 0x02,
    .iSerialNumber      = 0x03,

    .bNumConfigurations = 0x01
};

// TinyUSB calls this to fetch the device descriptor

uint8_t const *tud_descriptor_device_cb(void) {
    return (uint8_t const *) &desc_device;
}

// ---- Configuration Descriptor ------------------------------------------
enum {
    ITF_NUM_CDC = 0,       // CDC control interface (notification EP)
    ITF_NUM_CDC_DATA,      // CDC data interface (bulk IN/OUT)
    ITF_NUM_TOTAL
};

#define EPNUM_CDC_NOTIF   0x81   // interrupt IN, control/notification
#define EPNUM_CDC_OUT     0x02   // bulk OUT, host -> device (CMD_REQUEST)
#define EPNUM_CDC_IN      0x82   // bulk IN, device -> host (everything else)

#define CONFIG_TOTAL_LEN  (TUD_CONFIG_DESC_LEN + TUD_CDC_DESC_LEN)

uint8_t const desc_configuration[] = {
    // Config descriptor: bMaxPower=250 -> 500mA,
    TUD_CONFIG_DESCRIPTOR(1, ITF_NUM_TOTAL, 0, CONFIG_TOTAL_LEN,
                           0x00, 250),

    // CDC descriptor: interface number, string index, notif EP + size,
    // data OUT/IN EPs + size (64B = Full Speed bulk max)
    TUD_CDC_DESCRIPTOR(ITF_NUM_CDC, 0, EPNUM_CDC_NOTIF, 8,
                        EPNUM_CDC_OUT, EPNUM_CDC_IN, 64),
};

uint8_t const *tud_descriptor_configuration_cb(uint8_t index) {
    (void) index;
    return desc_configuration;
}

// ---- String Descriptors -------------------------------------------------
char const *string_desc_arr[] = {
    (const char[]) { 0x09, 0x04 },  // 0: supported language = English (US)
    "Alex Mills",                   // 1: Manufacturer
    "USB-C to CAN-FD Adapter",      // 2: Product
    "PS-0001",                      // 3: Serial
};

static uint16_t _desc_str[32];

uint16_t const *tud_descriptor_string_cb(uint8_t index, uint16_t langid) {
    (void) langid;
    size_t chr_count;

    if (index == 0) {
        memcpy(&_desc_str[1], string_desc_arr[0], 2);
        chr_count = 1;
    } else {
        if (index >= sizeof(string_desc_arr) / sizeof(string_desc_arr[0])) return NULL;
        const char *str = string_desc_arr[index];
        chr_count = strlen(str);
        if (chr_count > 31) chr_count = 31;
        for (size_t i = 0; i < chr_count; i++) _desc_str[1 + i] = str[i];
    }

    _desc_str[0] = (uint16_t)((TUSB_DESC_STRING << 8) | (2 * chr_count + 2));
    return _desc_str;
}
