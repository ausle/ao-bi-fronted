import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import LoginPage from '../views/LoginPage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import AnalysisPage from '../views/dashboard/AnalysisPage.vue'
import ChartsPage from '../views/dashboard/ChartsPage.vue'
import ProfilePage from '../views/dashboard/ProfilePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage, meta: { guestOnly: true } },
    { path: '/register', component: RegisterPage, meta: { guestOnly: true } },
    {
      path: '/dashboard',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard/analysis' },
        { path: 'analysis', component: AnalysisPage },
        { path: 'charts', component: ChartsPage },
        { path: 'profile', component: ProfilePage },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth)
  const guestOnly = to.matched.some((record) => record.meta?.guestOnly)

  if (requiresAuth && !userStore.isLoggedIn) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }

  if (guestOnly && userStore.isLoggedIn) return '/dashboard'
  return true
})

export default router
