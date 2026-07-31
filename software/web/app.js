import './store.js'
import { appLog } from './appLog.js'
import { connect } from './serial/serialConnection.js'

// Components
import './components/connectionStatus.js'
import './components/connectionStatusBadge.js'

appLog.info("App Started")

document.getElementById('connect-button').addEventListener('click', () => {
    connect()
})