import { register } from "../store.js"

const el = document.getElementById('x-connection-status-badge');
const inner = el.getElementsByTagName('span')[0]

export const component = register({

    watches: ['serialConnecting', 'serialConnected'],
    render(state) {

        el.classList = "badge border border-light rounded-circle p-1"

        if (state.serialConnecting) {
            el.classList.add('bg-warning')
            inner.textContent = 'Connecting...'
        } else if (state.serialConnected) {
            el.classList.add('bg-success')
            inner.textContent = 'Connected'
        } else {
            el.classList.add('bg-danger')
            inner.textContent = 'Not Connected'
        }
        
    }

})