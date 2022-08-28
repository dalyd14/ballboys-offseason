import { Container, Nav, Navbar } from 'react-bootstrap';
import { GiAmericanFootballHelmet } from 'react-icons/gi'

function NavigationBar({isLoggedin}) {

    return (
        <Navbar bg="dark" variant="dark">
            <Container>
                <Navbar.Brand href="/ballboys-offseason">Slowpoke Sports</Navbar.Brand>
                {
                    isLoggedin ?
                    <Nav className="me-auto">
                        <Nav.Link href="/ballboys-offseason/submit-roster">Submit Roster</Nav.Link>
                        <Nav.Link href="/ballboys-offseason/my-team">My Team</Nav.Link>
                        <Nav.Link href="/ballboys-offseason/other-teams">Other Teams</Nav.Link>
                    </Nav>
                    : <Nav className="me-auto"></Nav>
                }
                <Nav>
                    <Nav.Link href="/ballboys-offseason/login">
                        <GiAmericanFootballHelmet size={'1.5rem'}/>
                    </Nav.Link>
                </Nav>
            </Container>
        </Navbar>
    );
}

export default NavigationBar;