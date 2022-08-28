import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'

import { Navigate } from "react-router-dom";

import TeamViewTable from "../../components/TeamViewTable"

import { fetchMyTeamPlayers } from '../../redux/MyTeam/myTeam.actions'

import { Spinner, Card } from 'react-bootstrap'

const MyTeam = ({ appState, isLoggedin, getMyTeamPlayers }) => {
  useEffect(() => {
    getMyTeamPlayers(appState.currentUser["Owner Email"])
  },[])

  if (!isLoggedin) {
      return (
          <Navigate to="/login" replace />
      )
  }

  if (!appState.myTeamPlayers.loaded) {
    return (
      <div className='d-flex flex-column align-items-center my-5'>
        <Card>
          <Card.Body className='d-flex flex-column align-items-center'>
            <h1 className='my-3'>Your team is loading...</h1>
            <h3 className='mb-4'>At a Snail's pace</h3>
            <Spinner  animation="border" role="status"/>
          </Card.Body>
        </Card>
      </div>
    )
  }

  const players = appState.myTeamPlayers.myTeamPlayers

//   const players = [
//       {
//         "_id": "62ff772650f0f73018c3cdea",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Joe Burrow",
//         "NFL Team": "Cin",
//         "Position": "QB",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3915511.png&w=426&h=320&cb=1",
//         "Old Contract Years": "none",
//         "Old Negotiation Available": true,
//         "newAction": "sign",
//         "newContract": 3,
//         "newNegotiationAvailable": true
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdeb",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Cordarrelle Patterson",
//         "NFL Team": "Atl",
//         "Position": "RB",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/15807.png&w=426&h=320&cb=1",
//         "Old Contract Years": "none",
//         "Old Negotiation Available": true,
//         "newAction": "sign",
//         "newContract": 3,
//         "newNegotiationAvailable": true
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdec",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Darrel Williams",
//         "NFL Team": "Ari",
//         "Position": "RB",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3115375.png&w=426&h=320&cb=1",
//         "Old Contract Years": "none",
//         "Old Negotiation Available": true
//       },
//       {
//         "_id": "62ff772650f0f73018c3cded",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Keenan Allen",
//         "NFL Team": "LAC",
//         "Position": "WR",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/15818.png&w=426&h=320&cb=1",
//         "Old Contract Years": "1",
//         "Old Negotiation Available": true,
//         "newAction": "nothing",
//         "newContract": 1,
//         "newNegotiationAvailable": true
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdee",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Deebo Samuel",
//         "NFL Team": "SF",
//         "Position": "WR",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3126486.png&w=426&h=320&cb=1",
//         "Old Contract Years": "none",
//         "Old Negotiation Available": true
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdef",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Foster Moreau",
//         "NFL Team": "LV",
//         "Position": "TE",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3843945.png&w=426&h=320&cb=1",
//         "Old Contract Years": "none",
//         "Old Negotiation Available": true
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdf0",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "DeVonta Smith",
//         "NFL Team": "Phi",
//         "Position": "WR",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4241478.png&w=426&h=320&cb=1",
//         "Old Contract Years": "none",
//         "Old Negotiation Available": true
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdf1",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Giants",
//         "NFL Team": "NYG",
//         "Position": "D/ST",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/nyg.png&h=150&w=150&w=96&h=70&cb=1",
//         "Old Contract Years": "none",
//         "Old Negotiation Available": true
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdf2",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Matt Gay",
//         "NFL Team": "LAR",
//         "Position": "K",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4249087.png&w=426&h=320&cb=1",
//         "Old Contract Years": "none",
//         "Old Negotiation Available": true
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdf3",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Chris Carson",
//         "NFL Team": "FA",
//         "Position": "RB",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3919596.png&w=426&h=320&cb=1",
//         "Old Contract Years": "0",
//         "Old Negotiation Available": false
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdf4",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Jamaal Williams",
//         "NFL Team": "Det",
//         "Position": "RB",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/2980453.png&w=426&h=320&cb=1",
//         "Old Contract Years": "none",
//         "Old Negotiation Available": true
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdf5",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Allen Robinson II",
//         "NFL Team": "LAR",
//         "Position": "WR",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/16799.png&w=426&h=320&cb=1",
//         "Old Contract Years": "1",
//         "Old Negotiation Available": false,
//         "newAction": "nothing",
//         "newContract": 1,
//         "newNegotiationAvailable": false
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdf6",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Kenny Golladay",
//         "NFL Team": "NYG",
//         "Position": "WR",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/2974858.png&w=426&h=320&cb=1",
//         "Old Contract Years": "0",
//         "Old Negotiation Available": true,
//         "newAction": "renegotiate",
//         "newContract": 3,
//         "newNegotiationAvailable": false
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdf7",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Henry Ruggs III",
//         "NFL Team": "FA",
//         "Position": "WR",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4241475.png&w=426&h=320&cb=1",
//         "Old Contract Years": "1",
//         "Old Negotiation Available": true
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdf8",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Cardinals",
//         "NFL Team": "Ari",
//         "Position": "D/ST",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ari.png&h=150&w=150&w=96&h=70&cb=1",
//         "Old Contract Years": "none",
//         "Old Negotiation Available": true
//       },
//       {
//         "_id": "62ff772650f0f73018c3cdf9",
//         "Owner": "dalyd14@gmail.com",
//         "Player Name": "Michael Gallup",
//         "NFL Team": "Dal",
//         "Position": "WR",
//         "Image URL": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4036348.png&w=426&h=320&cb=1",
//         "Old Contract Years": "none",
//         "Old Negotiation Available": true
//       }
//   ]

  return (
    <TeamViewTable inputPlayers={players} currentOwner={appState.currentUser} />
  )
}

const mapStateToProps = (state) => ({
    appState: state
})

const mapDispatchToProps = (dispatch) => ({
    getMyTeamPlayers: (email) => dispatch(fetchMyTeamPlayers(email))
})

export default connect(mapStateToProps, mapDispatchToProps)(MyTeam)