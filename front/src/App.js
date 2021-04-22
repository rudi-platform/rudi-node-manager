import React, {Component} from 'react';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
} from 'react-router-dom';

import MetadataDetail from './components/metadataDetail/metadataDetail';
import Catalogue from './components/catalogue/catalogue';
import {createBrowserHistory} from 'history';

console.log("process.env.PUBLIC_URL : ", process.env.PUBLIC_URL)
// TODO : move to util.js
export const PUBLIC_URL = process.env.PUBLIC_URL;
export const history = createBrowserHistory({
  basename: PUBLIC_URL
});
/*
TODO :
- sticky filtre
- responsive
- filtre/sort/search
- remove key={...+i} when possible
*/

/**
 * Main Class
 */
class App extends Component {
  /**
 * render the app
 * @return {ReactNode} html of the app
 */
  render() {
    return (
      <Router basename={PUBLIC_URL} >
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <header>
          <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
            <div className="container-fluid">
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                data-bs-target="#navbarCollapse" aria-controls="navbarCollapse"
                aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarCollapse">
                <ul className="navbar-nav me-auto mb-2 mb-md-0">
                  <li className="nav-item">
                    <Link to="/"><button type="button" className="btn btn-primary">Catalogue</button></Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/licence"><button type="button" className="btn btn-primary">Licence</button></Link>
                  </li>
                  <li className="nav-item">
                    <button type="button" className="btn btn-primary">Visualisation</button>
                  </li>
                  <li className="nav-item">
                    <Link to="/gestion"><button type="button" className="btn btn-primary">Gestion</button></Link>
                  </li>
                  <li className="nav-item">
                    <button type="button" className="btn btn-primary">Monitoring</button>
                  </li>
                  <li className="nav-item">
                    <button type="button" className="btn btn-primary">Utilisateur</button>
                  </li>
                  <li className="nav-item">
                    <button type="button" className="btn btn-primary">Configuration</button>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </header>


        <div id="root"></div>

        <Switch>
          <Route exact path="/">
            <Catalogue />
          </Route>
          <Route path="/gestion">
            <Catalogue />
          </Route>
          <Route path="/licence">
          </Route>
          <Route path="/metadata/:id">
            <MetadataDetail />
          </Route>

        </Switch>
      </Router>
    );
  }
}

export default App;
