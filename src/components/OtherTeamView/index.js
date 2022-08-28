import React, { useState } from 'react'

import { Table, Image, ButtonGroup, Button } from 'react-bootstrap';

function OtherTeamView({ owners }) {

    const [currentOwner, setCurrentOwner] = useState({})


    const sharedColumns = [
        {from: "Image URL",to: ""},
        {from: "Player Name",to: "Player"},
        {from: "NFL Team",to: "NFL Team"},
        {from: "Position",to: "Position"}
    ]
    const notSubmittedColumns = [
        {from: "Old Contract Years",to: "Contract"},
        {from: "Old Negotiation Available",to: "Negotiation?"}
    ]
    const submittedColumns = [
        {from: "newAction", to: "Action"},
        {from: "newContract", to: "New Contract"},
        {from: "newNegotiationAvailable", to: "Negotiation?"}
    ]
    const notKeptColumns = [
        {from: "newAction", to: "Action"}
    ]
    const toDraftNotSubmittedColumns = [
        {from: "Owner",to: "Owner"},
        {from: "Old Contract Years",to: "Contract"},
        {from: "Old Negotiation Available",to: "Negotiation?"}
    ]

    if (Object.keys(currentOwner).length > 1 && !currentOwner["Can Submit"]) {
        const newPlayers = currentOwner.players.filter(player => player.newContract != "none")
        const cutPlayers = currentOwner.players.filter(player => player.newContract == "none")
        currentOwner.keptPlayers = newPlayers
        currentOwner.cutPlayers = cutPlayers
    }

    const donePlayerList = []
    if (currentOwner.special == "toDraft") {
        owners.forEach(owner => {
            owner.players.forEach(player => {
                if (!player["Old Negotiation Available"] && player["Old Contract Years"] !== "none" && player["Old Contract Years"] == 0) {
                    donePlayerList.push(
                        {
                            ...player,
                            "Owner": owner["Owner Name"]
                        }
                    )
                }
            })
        });
    }

    const updateOwner = (owner) => {
        setCurrentOwner(owner)
    }

    return (
        <div className='d-flex flex-row'>
            <ButtonGroup style={{ height: "90vh"}} vertical className='w-25'>
                {
                    owners.map(owner => {
                        return (
                            <Button key={owner["Owner Email"]} variant="secondary" onClick={() => {updateOwner(owner)}}>
                                <div className='d-flex flex-row justify-content-center align-items-center'>
                                    <div style={{width: "85%"}}>
                                        <h5 className='my-0'>{owner["Owner Name"]}</h5>
                                    </div>
                                    <div style={{width: "15%"}}>
                                        {
                                            !owner["Can Submit"] ? 
                                            (<h5 className='my-0'>✔️</h5>) : null
                                        }
                                    </div>
                                </div>
                            </Button>
                        )
                    })
                }
                <Button  variant="secondary" onClick={() => {updateOwner({ special: "toDraft" })}}>
                    <div className='d-flex flex-row justify-content-center align-items-center'>
                        <div style={{width: "85%"}}>
                            <h5 className='my-0'>Players to the Draft</h5>
                        </div>
                        <div style={{width: "15%"}}>
                            <h5 className='my-0'>❌</h5>
                        </div>
                    </div>
                </Button>
            </ButtonGroup>
            { currentOwner["Owner Email"] ? 
                <div className='w-75' style={{ height: "90vh", overflow: "auto"}}>
                    <div className="d-flex flex-row">
                        <div className='mx-3 my-2 w-50'>
                            <h2>{currentOwner["Owner Name"]}'s Team</h2>
                            <h4>{currentOwner["Team Name"]}</h4>                    
                        </div>
                        <div  className='mx-3 my-2 w-50'>
                            {!currentOwner["Can Submit"] ? 
                                <h2>Roster Submitted ✔️</h2> : 
                                <div>
                                    <h3>{currentOwner["Available Years"]} years this offseason</h3>
                                    <h3>{currentOwner["Available Negotiations"]} negotiation{currentOwner["Available Negotiations"] != 1 ? "s" : ""} this offseason</h3>
                                </div>
                            }
                        </div>
                    </div>
                    {
                        !currentOwner["Can Submit"] ?
                        <div className='my-5 mx-5'>
                            <h3 className='text-center'>The following {currentOwner.keptPlayers.length} players were kept by {currentOwner["Owner Name"]}</h3>
                        </div> : 
                        null
                    }
                    <Table striped>
                        <thead>
                            <tr>
                                {sharedColumns.map(col => col.to).map((head, index) => {
                                    return (<th key={`col-${index}`}>{head}</th>)
                                })}
                                {(!currentOwner["Can Submit"] ? submittedColumns : notSubmittedColumns).map(col => col.to).map((head, index) => {
                                    return (<th className="text-center" key={`add-col-${index}`}>{head}</th>)
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {(!currentOwner["Can Submit"] ? currentOwner.keptPlayers : currentOwner.players).map((row, index) => (
                                <tr key={row._id}>
                                    {sharedColumns.map((header, index) => {
                                        const breakdown = Object.entries(row)
                                        if (breakdown.some(item => header.from == item[0])) {
                                            const value = breakdown.find(item => header.from == item[0])
                                            switch (index) {
                                                case 0: 
                                                    return (
                                                        <td key={row._id + "-" + index}>
                                                            <Image height={!currentOwner["Can Submit"] ? "70px" : "100px"} src={value[1]} />
                                                        </td>
                                                    )
                                                default:
                                                    return (<td key={row._id + "-" + index} style={{verticalAlign: "middle"}}>{value[1].toString()}</td>)
                                            }                                
                                        }
                                    })}
                                    {
                                        !currentOwner["Can Submit"] ? (
                                            <>
                                                <td key={"action-" + index} style={{verticalAlign: "middle", textAlign: "center", fontSize: "1rem", fontWeight: "bold"}}>
                                                    { row["newAction"] == "nothing" ? "Carry Over" : (row["newAction"] == "sign" ? "Signed" : "Renegotiated" ) }
                                                </td>
                                                <td key={"years-" + index} style={{verticalAlign: "middle", textAlign: "center", fontSize: "3rem", fontWeight: "bold"}}>
                                                    { row["newContract"] == "none" ? "" : row["newContract"] }
                                                </td>
                                                <td key={"neg-" + index} style={{borderRight: "3px", borderRightColor: "inherit", borderRightStyle: "solid", fontSize: "3rem", verticalAlign: "middle", textAlign: "center"}}>
                                                    { row["newNegotiationAvailable"] ? "✅ ": "❌" }
                                                </td>                                
                                            </>
                                        ) : (
                                            <>
                                                <td key={"years-" + index} style={{verticalAlign: "middle", textAlign: "center", fontSize: "3rem", fontWeight: "bold"}}>
                                                    { row["Old Contract Years"] == "none" ? "" : row["Old Contract Years"] }
                                                </td>
                                                <td key={"neg-" + index} style={{borderRight: "3px", borderRightColor: "inherit", borderRightStyle: "solid", fontSize: "3rem", verticalAlign: "middle", textAlign: "center"}}>
                                                    { row["Old Negotiation Available"] ? "✅ ": "❌" }
                                                </td>                                
                                            </>
                                        )
                                    }

                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {
                        (!currentOwner["Can Submit"] && currentOwner.cutPlayers.length > 0) ?
                            <>
                            <div className="d-flex flex-column my-5 mx-5">
                                <h3 className="text-center">The following players were not kept on {currentOwner["Owner Name"]}'s team.</h3>
                                <h3 className="text-center">They will be available in the draft.</h3>
                            </div>
                            <Table striped>
                                <thead>
                                    <tr>
                                        {sharedColumns.map(col => col.to).map((head, index) => {
                                            return (<th key={`col-${index}`}>{head}</th>)
                                        })}
                                        {notKeptColumns.map(col => col.to).map((head, index) => {
                                            return (<th className="text-center" key={`add-col-${index}`}>{head}</th>)
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentOwner.cutPlayers.map((row, index) => (
                                        <tr key={row._id}>
                                            {sharedColumns.map((header, index) => {
                                                const breakdown = Object.entries(row)
                                                if (breakdown.some(item => header.from == item[0])) {
                                                    const value = breakdown.find(item => header.from == item[0])
                                                    switch (index) {
                                                        case 0: 
                                                            return (
                                                                <td key={row._id + "-" + index}>
                                                                    <Image height={!currentOwner["Can Submit"] ? "70px" : "100px"} src={value[1]} />
                                                                </td>
                                                            )
                                                        default:
                                                            return (<td key={row._id + "-" + index} style={{verticalAlign: "middle"}}>{value[1].toString()}</td>)
                                                    }                                
                                                }
                                            })}
                                            <td key={"cut-" + index} style={{verticalAlign: "middle", textAlign: "center", fontSize: "2rem", fontWeight: "bold"}}>
                                                Cut
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            </>
                        : null
                    }
                </div>
                : 
                ( 
                    currentOwner.special == "toDraft" ?
                    <div className='w-75' style={{ height: "90vh", overflow: "auto"}}>
                        <div className="d-flex flex-row">
                            <h3 className="my-4 mx-5">These players are going to the draft no matter what</h3>
                        </div>
                        <Table striped>
                            <thead>
                                <tr>
                                    {sharedColumns.map(col => col.to).map((head, index) => {
                                        return (<th key={`col-${index}`}>{head}</th>)
                                    })}
                                    {(toDraftNotSubmittedColumns).map(col => col.to).map((head, index) => {
                                        return (<th className="text-center" key={`add-col-${index}`}>{head}</th>)
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {donePlayerList.map((row, index) => (
                                    <tr key={row._id}>
                                        {sharedColumns.map((header, index) => {
                                            const breakdown = Object.entries(row)
                                            if (breakdown.some(item => header.from == item[0])) {
                                                const value = breakdown.find(item => header.from == item[0])
                                                switch (index) {
                                                    case 0: 
                                                        return (
                                                            <td key={row._id + "-" + index}>
                                                                <Image height="70px" src={value[1]} />
                                                            </td>
                                                        )
                                                    default:
                                                        return (<td key={row._id + "-" + index} style={{verticalAlign: "middle"}}>{value[1].toString()}</td>)
                                                }                                
                                            }
                                        })}
                                        {
                                            <>
                                                <td key={"owner-" + index} style={{verticalAlign: "middle", textAlign: "center", fontSize: "1rem", fontWeight: "bold"}}>
                                                    { row["Owner"] }
                                                </td>
                                                <td key={"years-" + index} style={{verticalAlign: "middle", textAlign: "center", fontSize: "1rem", fontWeight: "bold"}}>
                                                    { row["Old Contract Years"] == "none" ? "" : row["Old Contract Years"] }
                                                </td>
                                                <td key={"neg-" + index} style={{borderRight: "3px", borderRightColor: "inherit", borderRightStyle: "solid", fontSize: "3rem", verticalAlign: "middle", textAlign: "center"}}>
                                                    { row["Old Negotiation Available"] ? "✅ ": "❌" }
                                                </td>                                
                                            </>
                                        }
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                    : <h3 className='mx-5 my-5'>👈 Select a team from the list to the left</h3>
                )
            }
            
        </div>
    )
}

export default OtherTeamView;