import { LOAD_SUCCESS, LOAD_STARTED, LOAD_FAILED } from './myTeam.types'

let INITIAL_STATE = {}

export default function reducer(state = INITIAL_STATE, action) {
    switch (action.type) {
        case LOAD_SUCCESS:
            return {
                ...state,
                myTeamPlayers: action.payload,
                loaded: true
            }
        case LOAD_STARTED:
            return {
                ...state,
                loaded: false
            }
        case LOAD_FAILED:
            return {
                ...state,
                error: action.payload.error,
                loaded: true
            }
        default: return state;
    }
};