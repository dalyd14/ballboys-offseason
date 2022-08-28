import { Container, Nav, Navbar } from 'react-bootstrap';
import { GiAmericanFootballHelmet } from 'react-icons/gi'

import { useNavigate } from "react-router-dom";

function NavigationBar({isLoggedin}) {

    const navigate = useNavigate()

    return (
        <Navbar bg="dark" variant="dark">
            <Container>
                <Navbar.Brand onClick={() => {navigate("/")}}>Slowpoke Sports</Navbar.Brand>
                {
                    isLoggedin ?
                    <Nav className="me-auto">
                        <Nav.Link onClick={() => {navigate("/submit-roster")}} >Submit Roster</Nav.Link>
                        <Nav.Link onClick={() => {navigate("/my-team")}} >My Team</Nav.Link>
                        <Nav.Link onClick={() => {navigate("/other-teams")}} >Other Teams</Nav.Link>
                    </Nav>
                    : <Nav className="me-auto"></Nav>
                }
                <Nav>
                    <Nav.Link onClick={() => {navigate("/login")}} >
                        <GiAmericanFootballHelmet size={'1.5rem'}/>
                    </Nav.Link>
                </Nav>
            </Container>
        </Navbar>
    );
}

export default NavigationBar;