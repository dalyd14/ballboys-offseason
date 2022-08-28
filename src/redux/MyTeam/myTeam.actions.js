import { LOAD_SUCCESS, LOAD_STARTED, LOAD_FAILED, CHANGE_PLAYER } from './myTeam.types';

import { getTeamPlayers } from '../../utilities/apiRequests'

export const changePlayerDetails = (data) => ({
    type: CHANGE_PLAYER,
    playerID: data.playerID,
    playerDetails: data.details
});

const loadSuccess = data => ({
    type: LOAD_SUCCESS,
    payload: data
})

const loadStarted = () => ({
    type: LOAD_STARTED
})

const loadFailed = error => ({
    type: LOAD_FAILED,
    payload: {
        error
    }
})

export function fetchMyTeamPlayers(email) {
    return dispatch => {
        dispatch(loadStarted());
        
        getTeamPlayers(email)
            .then(response => {
                dispatch(loadSuccess(response))
            })
            .catch(e => {
                dispatch(loadFailed(e))
            })   
    }
}