import { PacketParser } from "./packetParser.js"

const parser = new PacketParser((packet) => {
    self.postMessage({ type:'packet', packet })
})

// Guard agaisnt overlapping connect attempts
let connectionActive = false

async function readLoop(port) {
    while(port.readable) {
        const reader = port.readable.getReader()

        try {
            while(true) {

                const { value, done } = await reader.read()
                
                // Reader has been cancelled
                if (done) {    
                    break;
                }

                // Parse supplied chunk of data
                parser.push(value)

            }
        } catch (err) {
            self.postMessage({ type: 'error', message: err.message })
        } finally {
            reader.releaseLock()
        }
    }
}

async function handleConnect() {

    if (connectionActive) {
        self.postMessage({type:'error', message:'Connection already in progress or open.'})
        return true
    }

    connectionActive = true

    try {

        const ports = await navigator.serial.getPorts()
        const port = ports[ports.length - 1]

        if (!port) {
            self.postMessage({ type: 'error', message: 'No authorized port found.'})
            return
        }

        await port.open({ baudeRate: 115200 })
        self.postMessage({ type: 'connected' })

        // Start reading data from the port
        await readLoop(port)

    } catch (err) {
        self.postMessage({type:'error', message: err.message})
    } finally {
        // Released once the whole connection lifecycle ends
        connectionActive = false
    }

}





self.onmessage = async (e) => {

    switch(e.data.type) {
        case 'connect':
            handleConnect()
            break;
    }

}