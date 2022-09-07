import React, { useState, useEffect } from 'react';
import './styles/App.scss';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import Catalogue from './components/catalogue/catalogue';
import CatalogueLicence from './components/catalogue/catalogueLicence';
import CatalogueUser from './components/users/catalogueUser';
import CatalogueProducer from './components/producer/catalogueProducer';
import CatalogueContact from './components/contact/catalogueContact';
import Visualisation from './components/visualisation/visualisation';
import { createBrowserHistory } from 'history';
import Login from './components/login/login';
import Register from './components/login/register';
import useToken from './useToken';
import { ModalProvider } from './components/modals/ModalContext';
import { GeneralContext } from './generalContext';
import axios from 'axios';
import Monitoring from './components/monitoring/monitoring';
import { getFrontOptions, OPT_TAG, getBackUrl } from './utils/frontOptions';
import CataloguePubKeys from './components/pub_key/cataloguePubKeys';

const VERSION_TAG = getFrontOptions(OPT_TAG);

export const history = createBrowserHistory({
  basename: getBackUrl(),
});

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

  const { token, updateToken } = useToken();
  const [isLoginOpen, setIsLoginOpen] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [generalConf, setGeneralConf] = useState({});

  const showLoginBox = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const showRegisterBox = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  useEffect(() => {
    if (!!token && !generalConf.formUrl) {
      Promise.all([
        axios.get(`api/v1/formUrl`).catch((e) => {
          return { data: '' };
        }),
        axios.get(`api/admin/enum/themes/fr`).catch((e) => {
          return { data: {} };
        }),
      ]).then((values) => {
        setGeneralConf({ formUrl: `${values[0].data}`, themeLabel: values[1].data });
      });
    }
  }, [token]);

  /**
   * Returns the code to display the version tag (if defined)
   * @return {ReactNode} the code to display the version tag (if defined)
   */
  function displayVersion() {
    return !VERSION_TAG ? '' : <div className="version">v.{VERSION_TAG}</div>;
  }

  /**
   * logout
   */
  function logout() {
    // console.log('-- logout');
    axios.get(getBackUrl('/api/v1/logout')).then((res) => updateToken());
  }

  if (!token) {
    return (
      <div>
        {isLoginOpen && <Login setToken={updateToken} />}
        {isRegisterOpen && <Register backToLogin={showLoginBox} />}
        <div className="login-switch">
          {!isLoginOpen && (
            <span className="badge badge-success badge-pill" onClick={showLoginBox}>
              Login
            </span>
          )}
          {!isRegisterOpen && (
            <span className="badge badge-success badge-pill" onClick={showRegisterBox}>
              Register
            </span>
          )}
        </div>
      </div>
    );
  }
  return (
    <Router>
      <ModalProvider>
        <GeneralContext.Provider value={generalConf}>
          <noscript>You need to enable JavaScript to run this app.</noscript>
          <div id="modal-test"></div>
          <header>
            <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-navbar">
              <div className="container-fluid">
                <img className="icon-navbar" src={`logo_blanc_orange.png`} alt="Rudi logo" />
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
                    <li className="nav-item">
                      <Link to={getBackUrl()}>
                        <button type="button" className="btn btn-primary button-margin">
                          Catalogue
                        </button>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to={getBackUrl('/licence')}>
                        <button type="button" className="btn btn-primary button-margin">
                          Licence
                        </button>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to={getBackUrl('/show')}>
                        <button type="button" className="btn btn-primary button-margin">
                          Visualisation
                        </button>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <DropdownButton id="dropdown-gestion-button" title="Gestion">
                        <Dropdown.Item as={Link} to={getBackUrl('/metadata')}>
                          Métadonnée
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to={getBackUrl('/producer')}>
                          Producteur
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to={getBackUrl('/contact')}>
                          Contacts
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to={getBackUrl('/pub_key')}>
                          Clés
                        </Dropdown.Item>
                      </DropdownButton>
                    </li>
                    <li className="nav-item hide-wip">
                      <Link to={getBackUrl('/monitoring')}>
                        <button type="button" className="btn btn-primary button-margin">
                          Monitoring
                        </button>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to={getBackUrl('/user')}>
                        <button type="button" className="btn btn-primary button-margin">
                          Utilisateur
                        </button>
                      </Link>
                    </li>
                    <li className="nav-item hide-wip">
                      <Link to={getBackUrl('/conf')}>
                        <button type="button" className="btn btn-primary button-margin">
                          Configuration
                        </button>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className="btn btn-secondary button-margin"
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
              path={getBackUrl('/metadata')}
              element={
                <Catalogue
                  display={{ searchbar: true, editJDD: true }}
                  specialSearch={{}}
                  editMode={{}}
                />
              }
            />
            <Route
              path={getBackUrl('/producer')}
              element={
                <CatalogueProducer
                  display={{ searchbar: true, editJDD: true }}
                  specialSearch={{}}
                  editMode={{}}
                />
              }
            />
            <Route
              path={getBackUrl('/contact')}
              element={
                <CatalogueContact
                  display={{ searchbar: true, editJDD: true }}
                  specialSearch={{}}
                  editMode={{}}
                />
              }
            />
            <Route
              path={getBackUrl('/pub_key')}
              element={
                <CataloguePubKeys
                  display={{ searchbar: true, editJDD: true }}
                  specialSearch={{}}
                  editMode={{}}
                />
              }
            />
            <Route
              path={getBackUrl('/licence')}
              element={<CatalogueLicence display={{ editJDD: false }} editMode={{}} />}
            />
            <Route path={getBackUrl('/show/:id')} element={<Visualisation />} />
            <Route path={getBackUrl('/show')} element={<Visualisation />} />
            <Route path={getBackUrl('/monitoring')} element={<Monitoring />} />
            <Route
              path={getBackUrl('/user')}
              element={<CatalogueUser display={{ searchbar: true, editJDD: true }} editMode={{}} />}
            />
            <Route
              path={getBackUrl('/conf')}
              element={<div className="tempPaddingTop">Work in progress</div>}
            />
          </Routes>
        </GeneralContext.Provider>
      </ModalProvider>
    </Router>
  );
}
