import { register } from "../store.js"

const el = document.getElementById('x-connection-status');

export const component = register({

    watches: ['serialConnecting', 'serialConnected'],
    render(state) {

        el.classList = "badge"

        if (state.serialConnecting) {
            el.classList.add('text-bg-warning')
            el.textContent = 'Connecting...'
        } else if (state.serialConnected) {
            el.classList.add('text-bg-success')
            el.textContent = 'Connected'
        } else {
            el.classList.add('text-bg-danger')
            el.textContent = 'Not Connected'
        }
        
    }

})