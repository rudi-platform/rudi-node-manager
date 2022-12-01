import React, { useState, useEffect } from 'react'
import { defaultFrontContext, PMFrontContextProvider, usePMFrontContext } from './generalContext'
import './styles/App.scss'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import DropdownButton from 'react-bootstrap/DropdownButton'
import Dropdown from 'react-bootstrap/Dropdown'
import Catalogue from './components/catalogue/catalogue'
import { CatalogueProducer } from './components/generic/catalogueProducer'
import { CatalogueContact } from './components/generic/catalogueContact'
import { CataloguePubKeys } from './components/generic/cataloguePubKeys'
import CatalogueLicence from './components/catalogue/catalogueLicence'
import CatalogueUser from './components/users/catalogueUser'
import Visualisation from './components/visualisation/visualisation'
import { createBrowserHistory } from 'history'
import Login, { showPill as showPillLogin } from './components/login/login'
import Register, { showPill as showPillRegister } from './components/login/register'
import useToken from './useToken'
import { ModalProvider } from './components/modals/modalContext_'
import axios from 'axios'
import Monitoring from './components/monitoring/monitoring'
import { getFrontOptions, OPT_TAG, getBackUrl } from './utils/frontOptions'
import ChangePwd, { showPill as showPillChgPwd } from './components/login/changePwd'

const VERSION_TAG = getFrontOptions(OPT_TAG)
const HAST_TAG = getBackUrl('front/hash')

export const getApiFront = (suffix) => (!suffix ? 'incorrect' : `api/front/${suffix}`)
export const getApiData = (suffix) => (!suffix ? 'incorrect' : `api/data/${suffix}`)

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

  const [isEditor, setIsEditor] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // const { userInfo } = appInfo
    // console.log('T (App.UseEffect) appInfo', appInfo)
    setIsEditor(!!appInfo?.isEditor)
    setIsAdmin(!!appInfo?.isAdmin)
  }, [appInfo, token])

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
  const displayVersion = () =>
    !VERSION_TAG ? (
      ''
    ) : (
      <div>
        <div className="version">v.{VERSION_TAG}</div> <div>{HAST_TAG}</div>
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
    axios.get(getBackUrl(getApiFront('logout'))).then((res) => {
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
                  <li className={isEditor ? 'nav-item' : 'nav-item hide-wip'}>
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
                      <Dropdown.Item as={Link} to={getBackUrl('pub_key')}>
                        Clés
                      </Dropdown.Item>
                    </DropdownButton>
                  </li>

                  {navItem('monitoring', 'Monitoring', false)}
                  {navItem('user', 'Utilisateurs', isAdmin)}
                  {navItem('conf', 'Configuration', false)}

                  <li className="nav-item center">
                    <button type="button" className="btn btn-secondary" onClick={() => logout()}>
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

        <Routes>
          <Route
            path={getBackUrl()}
            element={
              <Catalogue
                display={{ searchbar: true, editJDD: false }}
                specialSearch={{}}
                editMode={{}}
              />
            }
          />
          <Route
            path={getBackUrl('metadata')}
            element={
              <Catalogue
                display={{ searchbar: true, editJDD: isEditor }}
                specialSearch={{}}
                editMode={{}}
              />
            }
          />
          <Route
            path={getBackUrl('gestion')}
            element={
              <Catalogue
                display={{ searchbar: true, editJDD: isEditor }}
                specialSearch={{}}
                editMode={{}}
              />
            }
          />
          <Route
            path={getBackUrl('producer')}
            element={
              <CatalogueProducer
                display={{ searchbar: true, editJDD: isEditor }}
                specialSearch={{}}
                editMode={{}}
              />
            }
          />
          <Route
            path={getBackUrl('contact')}
            element={
              <CatalogueContact
                display={{ searchbar: true, editJDD: isEditor }}
                specialSearch={{}}
                editMode={{}}
              />
            }
          />
          <Route
            path={getBackUrl('pub_key')}
            element={
              <CataloguePubKeys
                display={{ searchbar: true, editJDD: isEditor }}
                specialSearch={{}}
                editMode={{}}
              />
            }
          />
          <Route
            path={getBackUrl('licence')}
            element={<CatalogueLicence display={{ editJDD: false }} editMode={{}} />}
          />
          <Route path={getBackUrl('show/:id')} element={<Visualisation />} />
          <Route path={getBackUrl('show')} element={<Visualisation />} />
          <Route path={getBackUrl('monitoring')} element={<Monitoring />} />
          <Route
            path={getBackUrl('user')}
            element={
              <CatalogueUser display={{ searchbar: true, editJDD: isEditor }} editMode={{}} />
            }
          />
          <Route
            path={getBackUrl('conf')}
            element={<div className="tempPaddingTop">Work in progress</div>}
          />
        </Routes>
      </ModalProvider>
    </Router>
  )
}
