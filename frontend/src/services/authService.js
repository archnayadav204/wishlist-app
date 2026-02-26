import api from './api'

export const register = (data) => api.post('/auth/register/', data)

export const login = (data) => api.post('/auth/login/', data)

export const saveTokens = (tokens) => {
  localStorage.setItem('access_token', tokens.access)
  localStorage.setItem('refresh_token', tokens.refresh)
}

export const clearTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export const isLoggedIn = () => !!localStorage.getItem('access_token')
