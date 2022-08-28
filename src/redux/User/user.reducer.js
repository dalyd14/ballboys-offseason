import { ADD_USER, CHANGE_USER, REMOVE_USER } from './user.types';

import { getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from '../../utilities/localStorage';

const logoutDateCompare = new Date(getLocalStorageItem('logoutDate'))
const nowDate = new Date()
const INITIAL_STATE = nowDate < logoutDateCompare ? getLocalStorageItem('loggedInUser') : {}

const reducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case ADD_USER:
            setLocalStorageItem('loggedInUser', action.data)
            let logOutDate = new Date()
            logOutDate.setDate(logOutDate.getDate() + 1)
            setLocalStorageItem('logoutDate', logOutDate)
            return { ...state, ...action.data }
        case REMOVE_USER:
            removeLocalStorageItem('loggedInUser')
            removeLocalStorageItem('logoutDate')
            return {}
        case CHANGE_USER:
            let updatedUser = {
                ...state,
                RosterSubmitted: action.rosterSubmitted
            }
            setLocalStorageItem('loggedInUser', updatedUser)
            return updatedUser
        default: return state;
    }
};

export default reducer