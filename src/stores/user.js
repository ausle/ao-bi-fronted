import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{"username":"Yupi","role":"用户"}'),
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
  },
  actions: {
    login(payload) {
      this.token = payload.token || 'mock-token'
      this.userInfo = payload.userInfo || { username: 'Yupi', role: '用户' }
      localStorage.setItem('token', this.token)
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
    },
    logout() {
      this.token = ''
      this.userInfo = { username: 'Yupi', role: '用户' }
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    },
  },
})
