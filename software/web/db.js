const DB_NAME = 'stuttgart'
const DB_VERSION = 2

const PACKETS_STORE = 'packets'
const APP_LOG_STORE = 'appLog'

let dbPromise = null

export function openDb() {

    // DB open promise already created
    if (dbPromise) {
        return dbPromise
    }

    dbPromise = new Promise((resolve, reject) => {

        // Attempt to open the database
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        // An attempt was made to open a database with a version
        // number higher than it's current version
        request.onupgradeneeded = (event) => {
            
            const db = event.target.result

            // Add Packets Store
            if (!db.objectStoreNames.contains(PACKETS_STORE)) {

                const store = db.createObjectStore(PACKETS_STORE, {
                    keyPath: 'id',
                    autoIncrement: true
                })

                store.createIndex('timestamp', 'timestamp')
                store.createIndex('packetType', 'packetType')

            }

            // Add AppLog Store
            if (!db.objectStoreNames.contains(APP_LOG_STORE)) {

                const store = db.createObjectStore(APP_LOG_STORE, {
                    keyPath: 'id',
                    autoIncrement: true
                })

                store.createIndex('timestamp', 'timestamp')
                store.createIndex('level', 'level')

            }

        }

        request.onsuccess = (event) => resolve(event.target.result)
        request.onerror = () => reject(request.error)
    })

    return dbPromise

}

export async function writeBatch(records) {

    if (records.length === 0) {
        return
    }

    const db = await openDb()
    const tx = db.transaction(PACKETS_STORE, 'readwrite')
    const store = tx.objectStore(PACKETS_STORE)

    // All add() calls issues synchonously back-to-back, required
    // so the transaction doesn't auto-commit early.
    for (const record of records) {
        store.add(record)
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })

}


export async function writeAppLog(entry) {

    const db = await openDb()
    const tx = db.transaction(APP_LOG_STORE, 'readwrite')
    const store = tx.objectStore(APP_LOG_STORE)

    store.add(entry)

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })

}