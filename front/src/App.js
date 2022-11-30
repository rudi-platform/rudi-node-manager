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
import { ModalProvider } from './components/modals/modalContext'
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
  // console.log('-- App');

  const { token, updateToken } = useToken()
  // const [generalConf, setGeneralConf] = useState({})
  const frontContext = usePMFrontContext()

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

  const setFrontContext = (context = defaultFrontContext) => {
    frontContext.formUrl = context.formUrl
    frontContext.themeLabels = context.themeLabels

    setDisplayFlags(context.userInfo)
  }

  const setDisplayFlags = (userInfo) => {
    frontContext.userInfo = userInfo
    if (
      !userInfo?.roles ||
      userInfo.roles.length === 0 ||
      (userInfo.roles.length === 1 && userInfo.roles[0] === 'Lecteur')
    ) {
      frontContext.isEditor = false
      frontContext.isAdmin = false
    } else if (userInfo.roles.findIndex((role) => role === 'SuperAdmin' || role === 'Admin') > -1) {
      frontContext.isEditor = true
      frontContext.isAdmin = true
    } else if (userInfo.roles.findIndex((role) => role === 'Editeur') > -1) {
      frontContext.isEditor = true
      frontContext.isAdmin = false
    }
    console.debug('T (setDisplayFlags) frontContext:', frontContext)
    console.debug('T (setDisplayFlags) isEditor', isEditor())
    console.debug('T (setDisplayFlags) isAdmin', isAdmin())
  }

  const isEditor = () => !!frontContext?.isEditor
  const isAdmin = () => !!frontContext?.isAdmin

  // const getUserInfo = () => {
  //   setUser(generalConf?.userInfo)
  // }
  // if (!userInfo) getUserInfo()

  useEffect(() => {
    if (!token) {
      console.debug('T (setGeneralConf) disconnected: conf=', frontContext)
      frontContext.userInfo = {}
    } else {
      Promise.all([
        axios.get(getApiFront('formUrl')).catch((er) => {
          console.error('T (setGeneralConf) err', er.message)
          return { data: '' }
        }),
        axios.get(getApiData('enum/themes/fr')).catch((er) => {
          console.error('T (setGeneralConf) err', er.message)
          return { data: {} }
        }),
        axios.get(getApiFront('user-info')).catch((er) => {
          console.error('T (setGeneralConf) err', er.message)
          return { data: {} }
        }),
      ]).then((values) => {
        setFrontContext({
          formUrl: `${values[0].data}`,
          themeLabels: values[1].data,
          userInfo: values[2].data,
        })
      })
      console.debug('T (setGeneralConf) connected: conf=', frontContext)
    }
  }, [token])

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
   */
  const logout = () => axios.get(getBackUrl(getApiFront('logout'))).then((res) => updateToken())

  if (!token) {
    return (
      <div>
        {isLoginOpen && <Login setToken={updateToken} setDisplayFlags={setDisplayFlags} />}
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
        <PMFrontContextProvider value={frontContext}>
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
                    <li className={isEditor() ? 'nav-item' : 'nav-item hide-wip'}>
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
                    {navItem('user', 'Utilisateurs', isAdmin())}
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
                  display={{ searchbar: true, editJDD: isEditor() }}
                  specialSearch={{}}
                  editMode={{}}
                />
              }
            />
            <Route
              path={getBackUrl('gestion')}
              element={
                <Catalogue
                  display={{ searchbar: true, editJDD: isEditor() }}
                  specialSearch={{}}
                  editMode={{}}
                />
              }
            />
            <Route
              path={getBackUrl('producer')}
              element={
                <CatalogueProducer
                  display={{ searchbar: true, editJDD: isEditor() }}
                  specialSearch={{}}
                  editMode={{}}
                />
              }
            />
            <Route
              path={getBackUrl('contact')}
              element={
                <CatalogueContact
                  display={{ searchbar: true, editJDD: isEditor() }}
                  specialSearch={{}}
                  editMode={{}}
                />
              }
            />
            <Route
              path={getBackUrl('pub_key')}
              element={
                <CataloguePubKeys
                  display={{ searchbar: true, editJDD: isEditor() }}
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
                <CatalogueUser display={{ searchbar: true, editJDD: isEditor() }} editMode={{}} />
              }
            />
            <Route
              path={getBackUrl('conf')}
              element={<div className="tempPaddingTop">Work in progress</div>}
            />
          </Routes>
        </PMFrontContextProvider>
      </ModalProvider>
    </Router>
  )
}
