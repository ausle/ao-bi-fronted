<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-brand">
        <h1>喜人同乐-数据分析平台</h1>
        <p>喜人同乐,诗人远行</p>
      </div>

      <h2 class="auth-title">账户密码登录</h2>

      <el-form :model="form" label-position="top" @submit.prevent>
        <el-form-item>
          <el-input v-model="form.username" placeholder="aosule1" size="large" clearable />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            placeholder="12345678"
            size="large"
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>

      <div class="link-row">
        <el-link type="primary" :underline="false" @click="goRegister">注册</el-link>
      </div>

      <el-button class="submit-btn" type="primary" size="large" :loading="loading" @click="handleLogin">
        登录
      </el-button>

      <div class="auth-footer">喜人同乐 xirentongle.cn</div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import request from '../utils/request'

const router = useRouter()
const userStore = useUserStore()
const form = reactive({ username: 'yupi', password: '12345678' })
const loading = ref(false)

const goRegister = () => router.push('/register')
const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const res = await request.post('/user/login', {
      userAccount: form.username,
      userPassword: form.password,
    })

    if (res?.code !== 0) {
      ElMessage.error(res?.message || '登录失败，请重试')
      return
    }

    const loginData = res?.data || {}
    userStore.login({
      token: `session-${Date.now()}`,
      userInfo: {
        username: loginData.userName || form.username,
        role: loginData.userRole || 'user',
      },
    })
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || '登录请求失败')
  } finally {
    loading.value = false
  }
}
</script>
