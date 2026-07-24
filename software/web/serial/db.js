const DB_NAME = 'stuttgart'
const DB_VERSION = 1
const STORE_NAME = 'packets'

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
            const store = db.createObjectStore(STORE_NAME, {
                keyPath: 'id',
                autoIncrement: true
            })

            store.createIndex('timestamp', 'timestamp')
            store.createIndex('packetType', 'packetType')

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

    const db = await openDb
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    // All add() calls issues synchonously back-to-back, required
    // so the transaction doesn't auto-commit early.
    for (const record in records) {
        store.add(record)
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })

}