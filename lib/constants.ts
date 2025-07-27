// API Configuration
export const API_BASE_URL = 'https://api.intra.42.fr';
export const API_TOKEN_ENDPOINT = `${API_BASE_URL}/oauth/token`;
export const API_USERS_ENDPOINT = `${API_BASE_URL}/v2/users`;

// App Configuration
export const MAX_LOGIN_LENGTH = 20;
export const APP_NAME = 'Swifty Companion';
export const APP_SUBTITLE = '42 Intranet Companion';

// Colors
export const COLORS = {
  primary: '#3498db',
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
  disabled: '#bdc3c7',
  text: {
    primary: '#2c3e50',
    secondary: '#7f8c8d',
    disabled: '#95a5a6',
  },
  background: '#f8f9fa',
  white: '#ffffff',
} as const; 