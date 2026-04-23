<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="logo-wrap">
        <div class="logo-icon">BI</div>
        <span class="logo-text">鱼智能 BI</span>
      </div>

      <el-menu :default-active="activeMenu" class="side-menu" @select="handleSelect">
        <el-menu-item index="/dashboard/analysis">
          <el-icon><DataLine /></el-icon>
          <span>智能分析</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/charts">
          <el-icon><PieChart /></el-icon>
          <span>我的图表</span>
        </el-menu-item>
      </el-menu>

      <div class="user-panel">
        <el-dropdown trigger="click" @command="handleCommand">
          <div class="user-trigger">
            <el-avatar :size="38" class="user-avatar">{{ userInitials }}</el-avatar>
            <div>
              <div class="user-name">{{ userStore.userInfo.username }}</div>
              <div class="user-role">{{ userStore.userInfo.role }}</div>
            </div>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DataLine, PieChart } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const userInitials = computed(() => (userStore.userInfo.username || 'U').slice(0, 2).toUpperCase())

const handleSelect = (index) => router.push(index)
const handleCommand = async (command) => {
  if (command === 'profile') return router.push('/dashboard/profile')
  if (command === 'logout') {
    try {
      const res = await request.post('/user/logout')
      if (res?.code !== 0) {
        ElMessage.warning(res?.message || '退出登录请求失败，已清理本地登录状态')
      } else {
        ElMessage.success('已退出登录')
      }
    } catch {
      ElMessage.warning('退出登录请求失败，已清理本地登录状态')
    }
    userStore.logout()
    router.push('/login')
  }
}
</script>
