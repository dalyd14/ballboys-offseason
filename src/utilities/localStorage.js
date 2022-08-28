const setLocalStorageItem = (key, data) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(data))
    } catch (e) {
        return e
    }
    return true
}

const getLocalStorageItem = (key) => {
    let response
    try {
        response = JSON.parse(window.localStorage.getItem(key))
    } catch (e) {
        return e
    }
    return response
}

const removeLocalStorageItem = (key) => {
    try {
        window.localStorage.removeItem(key)
    } catch (e) {
        return e
    }
    return true
}

const clearLocalStorageItems = () => {
    try {
        window.localStorage.clear()
    } catch (e) {
        return e
    }
    return true
}

export {
    setLocalStorageItem,
    getLocalStorageItem,
    removeLocalStorageItem,
    clearLocalStorageItems
}