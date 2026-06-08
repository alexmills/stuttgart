# Project Stuttgart

*Last Updated: 8th June 2026*

> Named after the founding location of Bosch in 1886, where a team in 1983 started development of the Connected Area Network.

The goal for this research project is to explore the benefits of having a clearer look at the CAN bus during vehicle diagnostics, instead of relying solely on multimeter or oscilloscope measurements.
## Overview

The tool connects to the CAN bus in a **read only** capacity, receiving messages and monitoring bus health while simultaneously measuring the voltage on the High and Low signal lines to identify physical layer faults. The CAN controller's transmit line is still connected for some future experiments with J1939.

A small web app connects to the tool using WebUSB (in Chrome/Edge) to control and monitor its data output in real time. 

*The design and component selection **will not** take production into consideration, this is purely a research project. I get easily sidetracked worrying about how to make n-amount instead of just making one first...*
## Isolation & Safety

The microcontroller and USB are completely isolated from the components connected to the vehicle electronics through the CAN bus, protecting the laptop and user from any potential voltage differences between chassis ground and mains earth. This isolation also eliminates ground loops, improves signal integrity, and provides a clean ground reference for the vehicle measurements.

## Target Vehicle / Networks

Primary targets are heavy duty vehicles which use a combination of J1939 and J2284 networks. The initial goal of the tool is not to decode these messages but to verify the bus is healthy and that frames are being transmitted without errors or corruption.

Both standards build on ISO 11898 *Road Vehicles - Controller Area Network (CAN),* with their own additions and modifications.

**J1939** spans both **physical** and **application** layers, defining its own physical layer specifications as well as how the messages are structured and what they mean. Unlike J2284, the use of CAN 2.0B 29-bit extended identifiers is mandated.

**J2284** defines the **physical** layer and portions of the **data link** layer, with OBD-II, UDS and proprietary **application** layers running on top. Both standards reference ISO 11898-2 for the high speed CAN physical layer, meaning the bus voltage levels are identical and the same transceiver hardware can be used across all target networks.
## Status

The current state of the project as follows:

- [x] Project Scope
- [x] Architecture & Protocol Design
- [x] Component Selection
- [ ] Schematic Design (Active)
- [ ] PCB Design
- [ ] Enclosure Design
- [ ] Firmware Implementation
- [ ] App Implementation
- [ ] Testing

## Main Components

| Component              | Part No                        | JLC No    | Status | Models |
| ---------------------- | ------------------------------ | --------- | ------ | ------ |
| MCU                    | Raspberry Pi RP2354A           | C41378174 | ✅      | 📦     |
| CAN FD Controller      | Microchip MCP251863            | C20295647 | ✅      | ✅      |
| Voltage ADC            | MCP3202-CI/SN                  | C56997    | ✅      | ✅      |
| Isolated DC-DC         | TI UCC12040DVER                | C5216535  | ✅      | ✅      |
| Digital Isolator 1     | TI ISO7741 (3F/1R)             | C913840   | ✅      | ✅      |
| Digital Isolator 2     | TI ISO7742 (2F/2R)             | C2868557  | ✅      | ✅      |
| 3.3V LDO (CAN Side)    | Microchip MCP1700T-3302E/TT    | C39051    | ✅      | ✅      |
| 3.3V LDO (MCU Side)    | OnSemi NCV1117ST33T3G          | C114733   | ✅      | ✅      |
| MCP2518FD Oscillator   | SCTF SX2M20.000B10F20TNN       | C7431315  | ✅      | 📦     |
| 12MHz Crystal          | Abracon ABM8-272-T3            | C20625731 | ✅      | ✅      |
| SMPS Inductor          | Abracon AOTA-B201610S3R3-101-T | C42411119 | ✅      | ✅      |
| Transceiver TVS Diodes | Littelfuse SMBJ5.0A x2         | C83333    | ✅      | 📦     |
| ADC Zener Diodes       | Onsemi BZX84C3V3LT1G           | C82473    | ✅      | 📦     |
| BOOTSEL Button         | Wurth 434133025816             | C5504987  | ✅      | ✅      |
| USB-C Connector        | GCT USB4105-GF-060             | C3025063  | ✅      | 📦     |
| SWD Header             | JST SM03B-SRSS-TB              | C160403   | ✅      | ✅      |
| CANH Socket            | Cliff FCR7350Y (Yellow)        | Digikey   | ✅      | ✅      |
| CANL Socket            | Cliff FCR7350G (Green)         | Digikey   | ✅      | ✅      |
| GND Socket             | Cliff FCR7350B (Black)         | Digikey   | ✅      | ✅      |

## System Architecture

Below is the high level architecture of the system, including the USB/Vehicle isolation and main active components.

![System Overview](content/stuttgart-system-overview-v1.1.jpg)

### Vehicle / USB Isolation

The 5V supply from the USB-C connector is isolated using a Texas Instruments UCC12040 DC-DC Module ([Datasheet](https://www.ti.com/lit/ds/symlink/ucc12040.pdf)), providing 3kV protection, low EMI and 500mW of output power.

The SPI and GPIO circuits are isolated using Texas Instruments ISO774X series digital isolators ([Datasheet](https://www.ti.com/lit/ds/symlink/iso7742.pdf)). Both have a SPI throughput of 100Mbps, providing more than enough headroom for the CAN Controller and ADC.

**ISO7742 (2F/2R) - SPI0 - MCP251863

| Channel | Signal   |
| ------- | -------- |
| F1      | SPI0 SCK |
| F2      | SPI0 TX  |
| R1      | SPI0 RX  |
| R2      | INT      |

**ISO7741 (3F/1R) - SPI1 - MCP3202**

| Channel | Signal   |
| ------- | -------- |
| F1      | SPI1 SCK |
| F2      | SP1 TX   |
| F3      | Spare    |
| R1      | SP1 RX   |

### Vehicle Interface

The CAN communication to the vehicle is achieved using a Microchip MCP2518FD CAN-FD ([Datasheet](https://ww1.microchip.com/downloads/aemDocuments/documents/OTH/ProductDocuments/DataSheets/External-CAN-FD-Controller-with-SPI-Interface-DS20006027B.pdf)) controller paired with the recommended ATA6563 Microchip transceiver ([Datasheet](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/ATA6562.3-Data-Sheet-20005790E.pdf)). The CAN Signals and vehicle reference ground are provided through CLIFF 4mm 1kV "banana" sockets usually found on multimeters, so my normal test leads and accessories can be used.

## Bus ADC Measurements

The voltage divider for each bus is `R1 = 10kΩ` and `R2 = 47kΩ` so the ratio is calculated as:

```
Vout = Vin x (R2 / (R1 + R2))
Vout = Vin x (47,000 / (10,000 + 47,000))
Vout = Vin x (47,000 / 57,000)
Vout = Vin x 0.8246
```

Below are the estimated values for the ADC measurements at various bus voltages using the above divider with a protection zener diode, clamping at ~3.3V, keeping the ADC within safe limits (3.6V Max). 

| Bus Voltage | ADC Voltage | RAW ADC Value | Notes                         |
| ----------- | ----------- | ------------- | ----------------------------- |
| 0           | 0           | 0             | Bus Dead / Off                |
| 1.5         | 1.237       | 1535          | CAN L Dominant                |
| 2.5         | 2.062       | 2559          | Recessive Idle                |
| 3.5         | 2.886       | 3583          | CAN H Dominant                |
| **3.9**     | **3.223**   | **4000**      | **Clean bus fault threshold** |
| 4.0         | 3.300       | 4095          | Zener Activates               |
| Over 4.0    | 3.300       | 4095          | Clamped - Fault Condition     |
