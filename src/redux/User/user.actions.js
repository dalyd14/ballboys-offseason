import { ADD_USER, REMOVE_USER, CHANGE_USER } from './user.types';

export const addUser = (data) => {
    return {
        type: ADD_USER,
        data: data
    };
};

export const changeUser = (value) => {
    return {
        type: CHANGE_USER,
        rosterSubmitted: value
    };
};

export const removeUser = () => {
    return {
       type: REMOVE_USER
    };
};