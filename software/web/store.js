
/*

    Local Persistance

*/

const STORAGE_KEY = 'stuttgart_v0'
const PERSIST_KEYS = [
    'canBitrate',
    'canListenOnly'
]

function loadPersistedState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        return saved ? JSON.parse(saved) : {}
    } catch (e) {
        alert("unable to load persisted state")
        console.error("Unable to load persisted state")
        console.log(e)
    }
}

function persistState(state) {
    
    let toSave = {};

    for (const key of PERSIST_KEYS) {
        toSave[key] = state[key]
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch (e) {
        alert("Unable to save persisted state")
        console.error("Unable to save persisted state")
        console.log(e)
    }

}

/*

    Store

*/

function createStore(initialState) {

    let state = { ...initialState }
    const listeners = new Set()
    
    console.log("Store: Base Store Setup")

    return {

        // Returns a shallow copy so callers can't mutate internal state
        get() {
            return { ...state }
        },

        // One-level-deep merge only.
        set(patch) {

            if (patch === state) {
                console.warn('store.set() called with previous state object directly')
            }

            // Merge patch into state
            state = { ...state, ...patch }

            // Notify listeners
            const changed = new Set(Object.keys(patch))

            for (const fn of listeners) {
                fn(state, changed)
            }

        },

        subscribe(fn) {
            listeners.add(fn)
            
            // Return unsubscribe handle
            return () => listeners.delete(fn)
        }

    }

}

/*

    Component Registry

*/

function createRegistry(store) {

    const components = []

    /*

        Registers a component so it receives render() calls on every store update,
        unless 'watches' is provided, which limits renders to when these keys change.

        Example:

        export const component = register({
            watches: ['key'] // optional
            render: function
        })

    */

    function register(component) {

        if (typeof component.render !== 'function') {
            throw new Error('register() requires a component with a render(state) method')
        }

        components.push(component)

        // Force intiial render of component regardless of watched keys is provided
        component.render(store.get())
        
        return component
    }

    store.subscribe((state, changed) => {
        for (const c of components) {

            // If component doesn't provide keys it's watching or a watched
            // key has changed, trigger the render for that component.
            const relevant = !c.watches || c.watches.some(k => changed.has(k))

            if (relevant) {
                c.render(state)
            }
        }
    })

    console.log("Store: Component Registry Setup")
    return register

} 

/*

    Instantiation

*/

const defaultState = {

    // Serial
    serialConnected: false,
    serialConnecting: false,
    serialPortName: false,
    serialError: null

}

export const store = createStore({
    ...defaultState,
    ...loadPersistedState()
})

store.subscribe(state => persistState(state))

export const register = createRegistry(store)

