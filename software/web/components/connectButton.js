import { register, store } from "../store.js"
import { connect, disconnect } from "../serial/serialConnection.js"

const el = document.getElementById('x-connect-button');

el.addEventListener('click', () => {
    
    const state = store.get()

    if (state.serialConnected) {
        disconnect()
    } else {
        connect()
    }

})

export const component = register({

    watches: ['serialConnected'],
    render(state) {

        el.classList = "btn"

        if (state.serialConnected) {
            el.classList.add('btn-danger')
            el.textContent = 'Disconnect'
        } else {
            el.classList.add('btn-primary')
            el.textContent = 'Connect'
        }
        
    }

})