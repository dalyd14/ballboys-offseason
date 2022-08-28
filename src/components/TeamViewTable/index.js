import { Table, Image } from 'react-bootstrap';

function TeamViewTable({ inputPlayers, currentOwner }) {

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

    if (currentOwner.RosterSubmitted) {
        const newPlayers = []
        inputPlayers.forEach(player => {
            if (player.newContract && player.newContract != "none") {
                newPlayers.push(player)
            }
        });
        inputPlayers = newPlayers
    }

    return (
        <>
        {
            currentOwner.RosterSubmitted ? 
            <h3 className='mx-5 my-4'>Awesome! Your roster has been submitted ✔️</h3> :
            <h3 className='mx-5 my-4'>Your roster has not been submitted yet...</h3>
        }
        <Table striped>
            <thead>
                <tr>
                    {sharedColumns.map(col => col.to).map((head, index) => {
                        return (<th key={`col-${index}`}>{head}</th>)
                    })}
                    {(currentOwner.RosterSubmitted ? submittedColumns : notSubmittedColumns).map(col => col.to).map((head, index) => {
                        return (<th className="text-center" key={`add-col-${index}`}>{head}</th>)
                    })}
                </tr>
            </thead>
            <tbody>
                {inputPlayers.map((row, index) => (
                    <tr key={row._id}>
                        {sharedColumns.map((header, index) => {
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
                                    default:
                                        return (<td key={row._id + "-" + index} style={{verticalAlign: "middle"}}>{value[1].toString()}</td>)
                                }                                
                            }
                        })}
                        {
                            currentOwner.RosterSubmitted ? (
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
        </>
    );
}

export default TeamViewTable;