import { writeAppLog } from "./db.js"

const LEVELS = Object.freeze({
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
})

function log(level, message) {
    
    const entry = {
        timestamp: Date.now(),
        level,
        message
    }

    // Show in browser console as well
    console[level === LEVELS.INFO ? 'log' : level](message)

    writeAppLog(entry).catch((err) => {
        console.error('Failed to persist app log entry:', err)
    })

}

export const appLog = {
    info: (message) => log(LEVELS.INFO, message),
    warn: (message) => log(LEVELS.WARN, message),
    error: (message) => log(LEVELS.ERROR, message)
}