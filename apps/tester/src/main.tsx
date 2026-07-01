import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { CollabAuthProvider } from './CollabAuthContext'
import { RuntimeSkiruProvider } from './RuntimeSkiruContext'
import { RuntimeWazaProvider } from './RuntimeWazaContext'
import { WazaAccessoriProvider } from './WazaAccessoriContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CollabAuthProvider>
      <RuntimeSkiruProvider>
        <RuntimeWazaProvider>
          <WazaAccessoriProvider>
            <App />
          </WazaAccessoriProvider>
        </RuntimeWazaProvider>
      </RuntimeSkiruProvider>
    </CollabAuthProvider>
  </React.StrictMode>,
)
