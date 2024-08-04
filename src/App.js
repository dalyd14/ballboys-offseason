import './App.css';
import React, { useState } from 'react'
import { connect } from 'react-redux';

import NavigationBar from './components/Navbar';

import Login from './pages/login'
import SubmitRoster from './pages/submitRoster';
import MyTeam from './pages/myTeam'
import OtherTeams from './pages/otherTeams'

import 'bootstrap/dist/css/bootstrap.min.css';


import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";

function App({appState}) {

  const isLoggedin = appState.currentUser["Owner Email"] ? true : false

  //{isLoggedin ? <Navigate to="/submit-roster" /> : <Navigate to="/login" /> }
  return (
    <Router basename="/ballboys-offseason">
      <NavigationBar isLoggedin={isLoggedin} />
      <Routes>
        <Route exact path="/" element={<SubmitRoster isLoggedin={isLoggedin} />} />
        <Route exact path="/login" element={<Login isLoggedin={isLoggedin}  />} />
        <Route exact path="/submit-roster" element={<SubmitRoster isLoggedin={isLoggedin} />} />
        <Route exact path="/my-team" element={<MyTeam isLoggedin={isLoggedin} />} />
        <Route exact path="/other-teams" element={<OtherTeams isLoggedin={isLoggedin} />} />
      </Routes>
    </Router>
  );
}

const mapStateToProps = (state) => ({
  appState: state
})

export default connect(mapStateToProps)(App)