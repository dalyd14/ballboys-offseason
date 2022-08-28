import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'

import { useNavigate } from "react-router-dom";

import { login } from '../../utilities/apiRequests'
import { addUser, removeUser } from '../../redux/User/user.actions'

import { Button, Form, Spinner, Alert, Card } from 'react-bootstrap'

const Login = ({ appState, loginUser, logoutUser }) => {
    const [loginDetails, setLoginDetails] = useState({
        email: "",
        password: ""
    })

    const [currentUser, setCurrentUser] = useState(appState.currentUser["Owner Email"])
    const [loading, setLoading] = useState(false)

    const [showAlert, setShowAlert] = useState(1)

    const navigate = useNavigate()

    const authLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        if (loginDetails.email && loginDetails.password) {
            let res = await login(loginDetails.email, loginDetails.password)
            if (res == "error") {
                console.log("Incorrect email or password")
                setShowAlert(0)
            } else {
                setCurrentUser(loginDetails.email)
                loginUser(res)
                navigate('/submit-roster')
            }
        }
        setLoading(false)
    }

    const logout = (e) => {
        e.preventDefault()
        setCurrentUser("")
        logoutUser()
    }

    if (currentUser) {
        return (
            <div className='d-flex justify-content-center flex-column align-items-center'>
                <Card className='mt-5 w-50'>
                    <Card.Body className='d-flex justify-content-center flex-column align-items-center'>
                        <h3>You are already logged in as</h3>
                        <h3 className='mb-3'>{currentUser}</h3>
                        <p>Feel free to logout, see if I care</p>
                        <Button className="w-50 my-2" variant="danger" onClick={e => logout(e)}>Logout</Button>
                    </Card.Body>
                </Card>
            </div>
        )
    }

    return (
        <>
        { showAlert == 0 &&
            <Alert variant="danger" onClose={() => setShowAlert(2)} dismissible>
                <Alert.Heading className='text-center'>Probably an incorrect email or password</Alert.Heading>
                <p className='text-center'>
                    If you think you put in the right stuff... honestly you probably did and Dave screwed up. Classic... just let him know.
                </p>
            </Alert>
        }
        <div className='d-flex justify-content-center flex-column align-items-center'>
            <h1 className='mt-5 mb-2'>Welcome to Ballboys Offseason</h1>
            <h3>Sign in with the email and password that Dave gave you.</h3>
            <Card className='mt-5 w-25'>
                <Card.Body>
                    <Form>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" placeholder="Enter email" onChange={e => {
                                setLoginDetails({...loginDetails, email: e.target.value})
                            }}/>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" placeholder="Password" onChange={e => {
                                setLoginDetails({...loginDetails, password: e.target.value})
                            }}/>
                        </Form.Group>

                        <Button variant="success" type="submit" className="w-100" onClick={e => authLogin(e)}>
                        { loading ? <Spinner  animation="border" role="status"/> : "Login" }
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
            <p className='mt-5'>If you are not a part of the Ballboys League, then I bid you adieu 👋</p>    
        </div>
        </>
    )
}

const mapStateToProps = (state) => ({
    appState: state
})

const mapDispatchToProps = (dispatch) => ({
    loginUser: (email) => dispatch(addUser(email)),
    logoutUser: () => dispatch(removeUser())
})

export default connect(mapStateToProps, mapDispatchToProps)(Login)