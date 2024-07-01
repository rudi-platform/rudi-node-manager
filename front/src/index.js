import React from 'react'
import ReactDOM from 'react-dom/client'

import './styles/index.css'

import App from './App'
import reportWebVitals from './reportWebVitals'

import 'bootstrap'
import { UserContextProvider } from './context/authContext.js'
import { BackDataContextProvider } from './context/backDataContext.js'
import { JwtContextProvider } from './context/jwtContext.js'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <JwtContextProvider>
      <UserContextProvider>
        <BackDataContextProvider>
          <App />
        </BackDataContextProvider>
      </UserContextProvider>
    </JwtContextProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
