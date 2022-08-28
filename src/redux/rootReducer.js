import { combineReducers } from 'redux';
import currentUser from './User/user.reducer';
import myTeamPlayers from './MyTeam/myTeam.reducer'

const rootReducer = combineReducers({
    currentUser,
    myTeamPlayers
});

export default rootReducer;