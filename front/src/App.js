import './styles/App.scss'

import axios from 'axios'

import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import DropdownButton from 'react-bootstrap/DropdownButton'
import Dropdown from 'react-bootstrap/Dropdown'

import { getApiFront, getBackUrl } from './utils/frontOptions'
import { createBrowserHistory } from 'history'
import useToken from './useToken'
import { defaultFrontContext, PMFrontContextProvider, usePMFrontContext } from './generalContext'

import Login, { showPill as showPillLogin } from './components/login/login'
import ChangePwd, { showPill as showPillChgPwd } from './components/login/changePwd'
import Register, { showPill as showPillRegister } from './components/login/register'

import Catalogue from './components/catalogue/catalogue'
import CatalogueLicence from './components/catalogue/catalogueLicence'
import CatalogueProducer from './components/generic/catalogueProducer'
import CatalogueContact from './components/generic/catalogueContact'
import CataloguePubKeys from './components/generic/cataloguePubKeys'
import CatalogueUser from './components/users/catalogueUser'
import Visualisation from './components/visualisation/visualisation'
import ModalProvider from './components/modals/genericModalContext'
import Monitoring from './components/monitoring/monitoring'

export const history = createBrowserHistory({ basename: getBackUrl() })

/*
TODO :
- sticky filtre
- responsive
- filtre/sort/search
- remove key={...+i} when possible
*/

/**
 * Main App component
 * @return {ReactNode} main html or login component
 */
export default function App() {
  return (
    <PMFrontContextProvider>
      <Main />
    </PMFrontContextProvider>
  )
}
const Main = () => {
  const { token, updateToken } = useToken()

  // ---------------- Loading context
  const { appInfo, setUserInfo } = usePMFrontContext()

  // ---------------- Login modals
  const [isLoginOpen, setIsLoginOpen] = useState(true)
  const [isChgPwdOpen, setIsChgPwdOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  const showLoginBox = () => {
    setIsLoginOpen(true)
    setIsChgPwdOpen(false)
    setIsRegisterOpen(false)
  }

  const showChgPwdBox = () => {
    setIsLoginOpen(false)
    setIsChgPwdOpen(true)
    setIsRegisterOpen(false)
  }

  const showRegisterBox = () => {
    setIsLoginOpen(false)
    setIsChgPwdOpen(false)
    setIsRegisterOpen(true)
  }

  /**
   * Returns the code to display the version tag (if defined)
   * @return {ReactNode} the code to display the version tag (if defined)
   */
  const displayVersion = () => (
    <div>
      <div className="appTag">{appInfo.appTag}</div>
      <div className="gitTag">{appInfo.gitHash}</div>
    </div>
  )

  /**
   *
   * @param {*} destUrl
   * @param {*} buttonText
   * @param {*} show
   * @return {ReactNode}
   */
  const navItem = (destUrl, buttonText, show = true) => (
    <li className={show ? 'nav-item' : 'nav-item hide-wip'}>
      <Link to={getBackUrl(destUrl)}>
        <button type="button" className="btn btn-primary">
          {buttonText}
        </button>
      </Link>
    </li>
  )

  /**
   * logout
   * @return {void}
   */
  const logout = () => {
    axios
      .get(getBackUrl(getApiFront('logout')))
      .then((res) => {
        updateToken()
        setUserInfo(defaultFrontContext)
      })
      .catch((err) => {
        console.error('T (logout)', err)
        updateToken()
        setUserInfo(defaultFrontContext)
      })
  }

  if (!token) {
    return (
      <div>
        {isLoginOpen && <Login setToken={updateToken} setUserInfo={setUserInfo} />}
        {isChgPwdOpen && <ChangePwd backToLogin={showLoginBox} />}
        {isRegisterOpen && <Register backToLogin={showLoginBox} />}
        <div className="login-switch">
          {showPillLogin(!isLoginOpen, showLoginBox)}
          {showPillChgPwd(!isChgPwdOpen, showChgPwdBox)}
          {showPillRegister(!isRegisterOpen, showRegisterBox)}
        </div>
      </div>
    )
  }
  return (
    <Router>
      <ModalProvider>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="modal-test"></div>
        <header>
          <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-navbar">
            <div className="container-fluid">
              <img
                className="icon-navbar logo-margin"
                src={`logo_blanc_orange.png`}
                alt="Rudi logo"
              />
              <button
                className="navbar-toggler align-right"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarCollapse"
                aria-controls="navbarCollapse"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarCollapse">
                <ul className="navbar-nav me-auto mb-2 mb-md-0">
                  {navItem('', 'Catalogue')}
                  {navItem('licence', 'Licence')}
                  {navItem('show', 'Visualisation')}
                  <li className={appInfo.isEditor ? 'nav-item' : 'nav-item hide-wip'}>
                    <DropdownButton id="dropdown-gestion-button" title="Gestion">
                      <Dropdown.Item as={Link} to={getBackUrl('metadata')}>
                        Métadonnées
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to={getBackUrl('producer')}>
                        Producteurs
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to={getBackUrl('contact')}>
                        Contacts
                      </Dropdown.Item>
                    </DropdownButton>
                  </li>
                  <li className={appInfo.isAdmin ? 'nav-item' : 'nav-item hide-wip'}>
                    <DropdownButton id="dropdown-gestion-button" title="Admin">
                      <Dropdown.Item as={Link} to={getBackUrl('pub_key')}>
                        Clés
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to={getBackUrl('user')}>
                        Utilisateurs
                      </Dropdown.Item>
                    </DropdownButton>
                  </li>

                  {navItem('monitoring', 'Monitoring', false)}
                  {navItem('conf', 'Configuration', false)}

                  <li className="nav-item center ">
                    <button
                      type="button"
                      className="margin-logout btn btn-secondary"
                      onClick={() => logout()}
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            {displayVersion()}
          </nav>
        </header>

        <div id="root"></div>

        <PMFrontContextProvider>
          <Routes>
            <Route path={getBackUrl()} element={<Catalogue editMode={false} />} />
            <Route
              path={getBackUrl('metadata')}
              element={<Catalogue editMode={appInfo.isEditor} />}
            />
            <Route
              path={getBackUrl('gestion')}
              element={<Catalogue editMode={appInfo.isEditor} />}
            />
            <Route
              path={getBackUrl('producer')}
              element={<CatalogueProducer editMode={appInfo.isEditor} />}
            />
            <Route
              path={getBackUrl('contact')}
              element={<CatalogueContact editMode={appInfo.isEditor} />}
            />
            <Route
              path={getBackUrl('pub_key')}
              element={<CataloguePubKeys editMode={appInfo.isAdmin} />}
            />
            <Route
              path={getBackUrl('licence')}
              element={<CatalogueLicence display={{ editJDD: false }} editMode={false} />}
            />
            <Route path={getBackUrl('show/:id')} element={<Visualisation />} />
            <Route path={getBackUrl('show')} element={<Visualisation />} />
            <Route path={getBackUrl('monitoring')} element={<Monitoring />} />
            <Route
              path={getBackUrl('user')}
              element={<CatalogueUser editMode={appInfo.isAdmin} />}
            />
            <Route path={getBackUrl('conf')} element={<div className="tempPaddingTop">WIP</div>} />
          </Routes>
        </PMFrontContextProvider>
      </ModalProvider>
    </Router>
  )
}
