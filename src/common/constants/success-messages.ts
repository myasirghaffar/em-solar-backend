export enum SuccessCodes {
  AUTH_REGISTER_SUCCESS = 'AUTH_REGISTER_SUCCESS',
  AUTH_LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGOUT_SUCCESS = 'AUTH_LOGOUT_SUCCESS',
  AUTH_REFRESH_SUCCESS = 'AUTH_REFRESH_SUCCESS',
}

export const SuccessMessages: Record<SuccessCodes, string> = {
  [SuccessCodes.AUTH_REGISTER_SUCCESS]: 'User registered successfully',
  [SuccessCodes.AUTH_LOGIN_SUCCESS]: 'Login successful',
  [SuccessCodes.AUTH_LOGOUT_SUCCESS]: 'Logout successful',
  [SuccessCodes.AUTH_REFRESH_SUCCESS]: 'Token refreshed successfully',
};

