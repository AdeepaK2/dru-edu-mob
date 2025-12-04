// API Configuration
// For development, you can override this in .env file

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api-dru.vercel.app';

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  apiVersion: 'v1',
  endpoints: {
    auth: {
      login: '/auth/login',
      signup: '/auth/signup',
      verifyEmail: '/auth/verify-email',
      verifyOtp: '/auth/verify-otp',
      resendOtp: '/auth/resend-otp',
      logout: '/auth/logout',
      profile: '/auth/profile',
    },
    subscription: {
      status: '/subscription/status',
      pricing: '/subscription/pricing',
      subscribe: '/subscription/subscribe',
      devSubscribe: '/subscription/dev-subscribe',
      cancel: '/subscription/cancel',
    },
    parent: {
      profile: '/parent/profile',
      students: '/parent/students',
    },
  },
};

// Helper function to build full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}/api/${API_CONFIG.apiVersion}${endpoint}`;
};

// Auth endpoints
export const AUTH_ENDPOINTS = {
  login: getApiUrl(API_CONFIG.endpoints.auth.login),
  signup: getApiUrl(API_CONFIG.endpoints.auth.signup),
  verifyEmail: getApiUrl(API_CONFIG.endpoints.auth.verifyEmail),
  verifyOtp: getApiUrl(API_CONFIG.endpoints.auth.verifyOtp),
  resendOtp: getApiUrl(API_CONFIG.endpoints.auth.resendOtp),
  logout: getApiUrl(API_CONFIG.endpoints.auth.logout),
  profile: getApiUrl(API_CONFIG.endpoints.auth.profile),
};

// Subscription endpoints
export const SUBSCRIPTION_ENDPOINTS = {
  status: getApiUrl(API_CONFIG.endpoints.subscription.status),
  pricing: getApiUrl(API_CONFIG.endpoints.subscription.pricing),
  subscribe: getApiUrl(API_CONFIG.endpoints.subscription.subscribe),
  devSubscribe: getApiUrl(API_CONFIG.endpoints.subscription.devSubscribe),
  cancel: getApiUrl(API_CONFIG.endpoints.subscription.cancel),
};

// Parent endpoints
export const PARENT_ENDPOINTS = {
  profile: getApiUrl(API_CONFIG.endpoints.parent.profile),
  students: getApiUrl(API_CONFIG.endpoints.parent.students),
};

export default API_CONFIG;
