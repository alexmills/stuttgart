#include "pico/stdlib.h"
#include "pico/time.h"
#include "tusb.h"
#include "packet.h"

#define DEBUG_LOG_INTERVAL_MS 1000

// --- TinyUSB device callbacks ---
void tud_mount_cb(void) {}
void tud_unmount_cb(void) {}
void tud_suspend_cb(bool remote_wakeup_en) { (void)remote_wakeup_en; } 
void tud_resume_cb(void) {}


int main()
{
    
    tusb_init();

    absolute_time_t next_send = make_timeout_time_ms(DEBUG_LOG_INTERVAL_MS);
    uint32_t counter = 0;

    while(1) {
        tud_task();  // TinyUSB - Must be called contiuously

        if (time_reached(next_send)) {
            next_send = make_timeout_time_ms(DEBUG_LOG_INTERVAL_MS);

            // Only bother building/sending if a host is actually listening
            // (DTR asserted). Otherwise this would just silently accumulate in
            // TinyUSB's internal TX buffer for no reason.
            if (tud_cdc_connected()) {
                char msg[32];
                int msg_len = snprintf(msg, sizeof(msg), "heartbeat #%lu", (unsigned long)counter++);

                uint8_t frame[PKT_DEBUG_LOG_MAX_LENGTH];
                size_t frame_len = pack_debug_log(frame, time_us_64(), DEBUG_LOG_LEVEL_INFO, msg, (uint8_t)msg_len);

                // Skip rather than block if TinyUSB's TX buffer doesn't have 
                // room - avoids stalling thw whole loop (and tud_task())
                // waiting on a host that isn't draining fast enough
                if (tud_cdc_write_available() >= frame_len) {
                    tud_cdc_write(frame, frame_len);
                    tud_cdc_write_flush();
                }
            }
        }
    }
}
