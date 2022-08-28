import { Container, Nav, Navbar } from 'react-bootstrap';
import { GiAmericanFootballHelmet } from 'react-icons/gi'

function NavigationBar({isLoggedin}) {

    return (
        <Navbar bg="dark" variant="dark">
            <Container>
                <Navbar.Brand href="/">Slowpoke Sports</Navbar.Brand>
                {
                    isLoggedin ?
                    <Nav className="me-auto">
                        <Nav.Link href="/submit-roster">Submit Roster</Nav.Link>
                        <Nav.Link href="/my-team">My Team</Nav.Link>
                        <Nav.Link href="/other-teams">Other Teams</Nav.Link>
                    </Nav>
                    : <Nav className="me-auto"></Nav>
                }
                <Nav>
                    <Nav.Link href="/login">
                        <GiAmericanFootballHelmet size={'1.5rem'}/>
                    </Nav.Link>
                </Nav>
            </Container>
        </Navbar>
    );
}

export default NavigationBar;