import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case actionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case actionTypes.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case actionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case actionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await authService.getProfile();
          dispatch({
            type: actionTypes.LOGIN_SUCCESS,
            payload: {
              user: response.data.user,
              token: token,
            },
          });
        } catch (error) {
          localStorage.removeItem('token');
          dispatch({
            type: actionTypes.LOGIN_FAILURE,
            payload: error.response?.data?.message || 'Failed to load user',
          });
        }
      } else {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      const response = await authService.login(email, password);
      
      localStorage.setItem('token', response.data.token);
      
      dispatch({
        type: actionTypes.LOGIN_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });
      
      toast.success('Login successful!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: actionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });
      toast.error(errorMessage);
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      const response = await authService.register(userData);
      
      localStorage.setItem('token', response.data.token);
      
      dispatch({
        type: actionTypes.LOGIN_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });
      
      toast.success('Registration successful!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: actionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });
      toast.error(errorMessage);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      dispatch({ type: actionTypes.LOGOUT });
      toast.success('Logged out successfully!');
    }
  };

  // Update user function
  const updateUser = async (userData) => {
    try {
      const response = await authService.updateProfile(userData);
      dispatch({
        type: actionTypes.UPDATE_USER,
        payload: response.data.user,
      });
      toast.success('Profile updated successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Update failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      await authService.forgotPassword(email);
      toast.success('Password reset link sent to your email!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset link';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (token, password) => {
    try {
      await authService.resetPassword(token, password);
      toast.success('Password reset successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
