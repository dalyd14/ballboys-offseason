const login = async (email, password) => {
    const pipeDreamUrl = "https://eo9fw1hmv8bokyj.m.pipedream.net"

    try {
        let response = await fetch(pipeDreamUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password
            })
        })
        response = await response.json()
        if (Array.isArray(response)) {
            return response[0]
        } else {
            return "error"
        }
    } catch (e) {
        return "error"
    }
}

const getOwner = async (email) => {
    const pipeDreamUrl = `https://eob6nnfhg6podhc.m.pipedream.net?email=${email}`
    try {
        let response = await fetch(pipeDreamUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        response = await response.json()

        return response[0]
    } catch (e) {
        return e
    }
}

const getTeamPlayers = async (email) => {
    const pipeDreamUrl = "https://eo4gmwkrukkivdl.m.pipedream.net"

    try {
        let response = await fetch(pipeDreamUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email
            })
        })

        response = await response.json()
    
        return response
    } catch (e) {
        return e
    }
}

const submitRoster = async (email, players) => {
    const pipeDreamUrl = `https://eowzun7gng46stu.m.pipedream.net?email=${email}`

    try {
        let response = await fetch(pipeDreamUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(players)
        })

        response = await response.json()
        let allGood = true
        response.forEach(res => {
            if (!res) allGood = false
        });
        if (allGood) {
            return "success"
        } else {
            return "error"
        }
    } catch (e) {
        return e
    }
}

const resetRoster = async (email) => {
    const pipeDreamUrl = `https://eo30vq2jvdwgtrq.m.pipedream.net?email=${email}`
    try {
        let response = await fetch(pipeDreamUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        response = await response.json()

        return response
    } catch (e) {
        return e
    }
}

const getEverything = async () => {
    const pipeDreamUrl = "https://eogsgp9m33wl5qg.m.pipedream.net"

    try {
        let response = await fetch(pipeDreamUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        response = await response.json()
    
        return response
    } catch (e) {
        return e
    }
}
export {
    login,
    getTeamPlayers,
    submitRoster,
    getOwner,
    resetRoster,
    getEverything
}