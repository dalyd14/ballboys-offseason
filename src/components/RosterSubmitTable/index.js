import React, { useState } from 'react'
import { connect } from 'react-redux'

import { useNavigate } from "react-router-dom";

import { Table, Image, Form, ProgressBar, Button, Alert, Spinner } from 'react-bootstrap';

import { changeUser } from '../../redux/User/user.actions'

import { submitRoster } from '../../utilities/apiRequests'

function RosterSubmitTable({ inputPlayers, currentOwner, resetOwner }) {

    const [players, setPlayers] = useState(inputPlayers)
    const [renYear, setRenYear] = useState(currentOwner["Available Negotiations"])
    const [showAlert, setShowAlert] = useState(2)
    const [showSpinner, setShowSpinner] = useState(false)

    const navigate = useNavigate()

    const columns = [
        {from: "Image URL",to: ""},
        {from: "Player Name",to: "Player"},
        {from: "NFL Team",to: "NFL Team"},
        {from: "Position",to: "Position"},
        {from: "Old Contract Years",to: "Contract"},
        {from: "Old Negotiation Available",to: "Negotiation?"}
    ]
    const additionalColumns = [
        {from: "Action", to: "Action"},
        {from: "Years", to: "Years"},
        {from: "Final Contract", to: "Final Contract"}
    ]

    const handleActionChange = (action, index) => {
        const player = players[index]
        if (action == "renegotiate") {
            setRenYear(renYear - 1)
            player.newNegotiationAvailable = false
        } else if (action == "nothing") {
            player.newContract = player["Old Contract Years"] == "none" ? "none" : parseInt(player["Old Contract Years"])
            player.yearDebit = 0
        } else if (action == "cut") {
            player.newContract = 0
            player.yearDebit = Math.ceil(parseInt(player["Old Contract Years"])/2)
        }
        if (player.action == "renegotiate" && action != "renegotiate") {
            setRenYear(renYear + 1)
            player.newNegotiationAvailable = true
        }
        player.action = action
        setPlayers([...players])
    }
    const handleYearChange = (year, index) => {
        const player = players[index]
        switch (player.action) {
            case "sign":
                if (year == "nothing") {
                    player.yearDebit = 0
                    player.newContract = "none"
                } else {
                    let signYear = parseInt(year)
                    player.yearDebit = signYear
                    player.newContract = signYear
                    player.newNegotiationAvailable = true
                }
                break;
            case "renegotiate":
                let renYear = (year == "nothing" ? 0 : parseInt(year)) + parseInt(player["Old Contract Years"])
                player.yearDebit = renYear
                player.newContract = renYear
                break;
            case "cut":
                player.newContract = 0
                player.yearDebit = Math.ceil(parseInt(player["Old Contract Years"])/2)
                break;
            default: 
                player.newContract = "none"
                player.yearDebit = player["Old Contract Years"] == "none" ? 0 : parseInt(player["Old Contract Years"])
                break;
        }
        setPlayers([...players])
    }
    const generateActionOptions = (player) => {
        const opts = []
        if (player["Old Contract Years"] == "none") {
            opts.push(<option key={"actionOpt-sign"} value="sign">Sign</option>)
        } else {
            if (parseInt(player["Old Contract Years"]) > 0) {
                opts.push(<option key={"actionOpt-vut"} value="cut">Cut</option>)
            }
            if (player["Old Negotiation Available"] && (renYear > 0 || player.action == "renegotiate")) {
                opts.push(<option key={"actionOpt-ren"} value="renegotiate">Renegotiate</option>)
            }
        }
        opts.push(<option key={"actionOpt-nothing"} value="nothing">Do Nothing</option>)
        return opts
    }
    const generateYearOptions = (player) => {
        let totalYears = currentOwner["Available Years"]
        let botYear = 1
        const opts = []
        opts.push(<option key={0} value="nothing"></option>)
        if (player.action && player.action != "nothing" && player.action != "cut") {            
            players.forEach(play => {
                if (play._id == player._id) {
                    totalYears -= parseInt(play["Old Contract Years"] == "none" ? 0 : play["Old Contract Years"] )
                    if (player.action == "renegotiate") {
                        botYear = -Math.abs(parseInt(player["Old Contract Years"]))
                    }
                } else {
                    totalYears -= (play.action && play.action != "nothing") ? (typeof play.yearDebit !== 'undefined' ? play.yearDebit : parseInt(play["Old Contract Years"] == "none" ? 0 : play["Old Contract Years"])) : parseInt(play["Old Contract Years"] == "none" ? 0 : play["Old Contract Years"])                
                }
            })
            for (let i=botYear; i<=totalYears; i++) {
                if (i != 0) {
                    opts.push(<option key={"yearOpt-" + i} value={i}>{i}</option>)
                }
            }
        }
        return opts
    }

    const handleResetRoster = () => {
        const newPlayers = players.map(player => {
            return {
                ...player,
                action: "nothing",
                newContract: "none",
                yearDebit: 0,
                newNegotiationAvailable: null
            }
        })
        setPlayers([...newPlayers])
        setRenYear(currentOwner["Available Negotiations"])
    }
    const handleSubmitRoster = async () => {
        setShowSpinner(true)
        const keptPlayers = []
        players.forEach(player => {
            if ((!player.action || player.action == "nothing") && (player["Old Contract Years"] != "none" && parseInt(player["Old Contract Years"]) > 0)) {
                player.newContract = parseInt(player["Old Contract Years"])
                player.newNegotiationAvailable = player["Old Negotiation Available"]
                player.newAction = player.action || "nothing"
            }
            if (player.newContract && player.newContract != "none") {
                keptPlayers.push({
                    _id: player._id,
                    "Player Name": player["Player Name"],
                    newContract: player.newContract,
                    newNegotiationAvailable: player.newNegotiationAvailable,
                    newAction: player.action || "nothing"
                })
            }
        })
        const response = await submitRoster(currentOwner["Owner Email"], keptPlayers)
        setShowSpinner(false)
        if (response == "success") {
            resetOwner(true)
            setShowAlert(1)
            setTimeout(() => {
                navigate('/my-team')
            }, 2000)
        } else {
            setShowAlert(0)
        }
    }
    
    let tempYears = currentOwner["Available Years"]
    players.forEach(play => {
        tempYears -= (play.action && play.action != "nothing") ? (typeof play.yearDebit !== 'undefined' ? play.yearDebit : parseInt(play["Old Contract Years"] == "none" ? 0 : play["Old Contract Years"])) : parseInt(play["Old Contract Years"] == "none" ? 0 : play["Old Contract Years"])
    })

    const actYears = currentOwner["Available Years"]
    return (
        <>
        { showAlert != 2 &&
            <Alert variant={ showAlert == 0 ? "danger" : "success" } onClose={() => setShowAlert(2)} dismissible>
                <Alert.Heading>{ showAlert == 0 ? "Dave Sucks!" : "You are all set!" }</Alert.Heading>
                <p>
                    { showAlert == 0 ? 
                    "Something must've gone wrong. Reach out to Dave and tell him to shape up. Press the reset button to try again" : 
                    "Your roster was submitted. If you want to make changes then press the reset button below." }
                </p>
            </Alert>
        }
        <section>
            <div className='d-flex flex-row'>
                <div className='mx-5 my-2'>
                    <h1>
                        {tempYears} Years Left
                    </h1>
                    <ProgressBar now={tempYears/actYears*100} variant={(tempYears/actYears*100) < 30 ? "danger" : (tempYears/actYears*100) < 60 ? "warning" : "success"} />
                </div>
                <h1 className='mx-5 my-2'>
                    {renYear} Negotiation{renYear == 1 ? "" : "s"} Left
                </h1>
                <Button className='m-2' style={{width: '250px'}}  variant="success" onClick={handleSubmitRoster}>
                    { showSpinner ? <Spinner animation="border" role="status"/> : "Submit" }
                </Button>
                <Button className='m-2' style={{width: '100px'}} variant="danger" onClick={handleResetRoster}>
                    Reset
                </Button>
            </div>
        </section>
        <Table striped>
            <thead>
                <tr>
                    {columns.map(col => col.to).map((head, index) => {
                        return (<th key={`col-${index}`}>{head}</th>)
                    })}
                    {additionalColumns.map(col => col.to).map((head, index) => {
                        return (<th key={`add-col-${index}`}>{head}</th>)
                    })}
                </tr>
            </thead>
            <tbody>
                {players.map((row, index) => (
                    <tr key={row._id}>
                        {columns.map((header, index) => {
                            const breakdown = Object.entries(row)
                            if (breakdown.some(item => header.from == item[0])) {
                                const value = breakdown.find(item => header.from == item[0])
                                switch (index) {
                                    case 0: 
                                        return (
                                            <td key={row._id + "-" + index}>
                                                <Image height="100px" src={value[1]} />
                                            </td>
                                        )
                                    case 4:
                                        return (<td key={row._id + "-" + index} style={{verticalAlign: "middle", textAlign: "center", fontSize: "3rem", fontWeight: "bold"}}>{ value[1] == "none" ? "" : value[1] }</td>)
                                    case 5: 
                                        return (<td key={row._id + "-" + index} style={{borderRight: "3px", borderRightColor: "inherit", borderRightStyle: "solid", fontSize: "3rem", verticalAlign: "middle", textAlign: "center"}}>{ value[1] ? "✅ ": "❌" }</td>)
                                    default:
                                        return (<td key={row._id + "-" + index} style={{verticalAlign: "middle"}}>{value[1].toString()}</td>)
                                }                                
                            }
                        })}
                        <td key={`action-${index}`} style={{verticalAlign: "middle"}}>
                            <Form.Select value={row.action || "nothing"} size="lg" onChange={(e) => handleActionChange(e.target.value, index)}>
                                {generateActionOptions(row)}
                            </Form.Select>
                        </td>
                        <td key={`year-${index}`} style={{verticalAlign: "middle"}}>
                            <Form.Select defaultValue={"nothing"} size="lg" onChange={(e) => handleYearChange(e.target.value, index)}>
                                {generateYearOptions(row)}
                            </Form.Select>
                        </td>
                        <td key={`final-${index}`} style={{verticalAlign: "middle", textAlign: "center", fontSize: "3rem", fontWeight: "bold"}}>
                            {(row.newContract == "none" || (typeof row.newContract == "undefined" && parseInt(row["Old Contract Years"]) > 0 )) ? (row["Old Contract Years"] == "none" ? "" : parseInt(row["Old Contract Years"])) : row.newContract}
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
        </>
    );
}

const mapStateToProps = (state) => ({
    appState: state
})

const mapDispatchToProps = (dispatch) => ({
    resetOwner: (bool) => dispatch(changeUser(bool))
})

export default connect(mapStateToProps, mapDispatchToProps)(RosterSubmitTable)