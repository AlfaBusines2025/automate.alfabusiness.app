const initialState = {
    isAdmin: false,
    loginAutomate: false
}

export default function adminReducer(state = initialState, action) {
    switch (action.type) {
        case 'SET_ADMIN_STATE':
            return {
                ...state,
                isAdmin: !!action.payload.is_admin,
                loginAutomate: !!action.payload.login_automate
            }
        default:
            return state
    }
}
