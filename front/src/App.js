import React from 'react';
import './App.css';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';

import MetadataDetail from './components/metadataDetail/metadataDetail';
import Catalogue from './components/catalogue/catalogue';
import CatalogueLicence from './components/catalogue/catalogueLicence';
import Visualisation from './components/visualisation/visualisation';
import { createBrowserHistory } from 'history';
import Login from './components/login/login';
import useToken from './useToken';

console.log('process.env.PUBLIC_URL : ', process.env.PUBLIC_URL);
// TODO : move to util.js
export const PUBLIC_URL = process.env.PUBLIC_URL;
export const history = createBrowserHistory({
  basename: PUBLIC_URL,
});
/*
TODO :
- sticky filtre
- responsive
- filtre/sort/search
- remove key={...+i} when possible
- catch error on axios call
*/

/**
 * Main App component
 * @return {ReactNode} main html or login component
 */
export default function App() {
  const { token, setToken } = useToken();
  console.log('token : ', token);
  if (!token) {
    return <Login setToken={setToken} />;
  }
  return (
    <Router basename={PUBLIC_URL}>
      <noscript>You need to enable JavaScript to run this app.</noscript>
      <header>
        <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
          <div className="container-fluid">
            <button
              className="navbar-toggler"
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
                  <Link to="/">
                    <button type="button" className="btn btn-primary button-margin">
                      Catalogue
                    </button>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/licence">
                    <button type="button" className="btn btn-primary button-margin">
                      Licence
                    </button>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/show/">
                    <button type="button" className="btn btn-primary button-margin">
                      Visualisation
                    </button>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/gestion">
                    <button type="button" className="btn btn-primary button-margin">
                      Gestion
                    </button>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/monitoring">
                    <button type="button" className="btn btn-primary button-margin">
                      Monitoring
                    </button>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/user">
                    <button type="button" className="btn btn-primary button-margin">
                      Utilisateur
                    </button>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/conf">
                    <button type="button" className="btn btn-primary button-margin">
                      Configuration
                    </button>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

      <div id="root"></div>

      <Switch>
        <Route exact path="/">
          <Catalogue
            display={{ searchbar: true, editJDD: false }}
            specialSearch={{}}
            editMode={{}}
          />
        </Route>
        <Route path="/gestion">
          <Catalogue
            display={{ searchbar: true, editJDD: true }}
            specialSearch={{}}
            editMode={{}}
          />
        </Route>
        <Route path="/licence">
          <CatalogueLicence display={{ editJDD: true }} editMode={{}} />
        </Route>
        <Route path="/show/:id">
          <Visualisation />
        </Route>
        <Route path="/show">
          <Visualisation />
        </Route>
        <Route path="/monitoring">
          <div className="tempPaddingTop">Work in progress</div>
        </Route>
        <Route path="/user">
          <div className="tempPaddingTop">Work in progress</div>
        </Route>
        <Route path="/conf">
          <div className="tempPaddingTop">Work in progress</div>
        </Route>
        <Route path="/metadata/:id">
          <MetadataDetail />
        </Route>
      </Switch>
    </Router>
  );
}
