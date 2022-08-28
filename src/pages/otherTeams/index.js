import React, { useState, useEffect } from 'react'

import { Navigate } from "react-router-dom";

import OtherTeamView from "../../components/OtherTeamView"
import { getEverything } from "../../utilities/apiRequests"

import { Spinner, Card } from 'react-bootstrap'

const OtherTeams = ({ isLoggedin }) => {
  
    const [teamsLoading, setTeamsLoading] = useState(false)
    const [owners, setOwners] = useState([])

    useEffect(() => {
        const getStuff = async () => {
            setTeamsLoading(true)
            const tempOwners = await getEverything()
            setOwners(tempOwners)
            setTeamsLoading(false)
            return tempOwners
        }
        if (isLoggedin) {
            getStuff()
        }
    },[])

    if (!isLoggedin) {
        return (
            <Navigate to="/login" replace />
        )
    }

    if (teamsLoading) {
        return (
        <div className='d-flex flex-column align-items-center my-5'>
            <Card>
            <Card.Body className='d-flex flex-column align-items-center'>
                <h1 className='my-3'>The teams are loading...</h1>
                <h3 className='mb-4'>Like a Slowpoke</h3>
                <Spinner  animation="border" role="status"/>
            </Card.Body>
            </Card>
        </div>
        )
    }

    return (
        <OtherTeamView owners={owners} />
    )
}

export default OtherTeams