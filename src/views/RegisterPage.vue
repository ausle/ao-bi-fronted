<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-brand">
        <h1>鱼智能 BI</h1>
        <p>编程导航知识星球的原创项目</p>
      </div>

      <h2 class="auth-title">用户注册</h2>

      <el-form :model="form" label-position="top" @submit.prevent>
        <el-form-item>
          <el-input v-model="form.userAccount" placeholder="请输入账号" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.userPassword" placeholder="请输入密码" size="large" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.checkPassword"
            placeholder="请确认密码"
            size="large"
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>

      <div class="link-row">
        <el-link type="primary" :underline="false" @click="goLogin">已有账号？去登录</el-link>
      </div>

      <el-button class="submit-btn" type="primary" size="large" :loading="loading" @click="handleRegister">
        注册
      </el-button>

      <div class="auth-footer">编程导航 codefather.cn</div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const router = useRouter()
const loading = ref(false)
const form = reactive({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
})

const goLogin = () => router.push('/login')
const handleRegister = async () => {
  if (!form.userAccount || !form.userPassword || !form.checkPassword) {
    ElMessage.warning('请填写完整注册信息')
    return
  }
  if (form.userPassword !== form.checkPassword) {
    ElMessage.error('两次密码输入不一致')
    return
  }

  loading.value = true
  try {
    const res = await request.post('/user/register', {
      userAccount: form.userAccount,
      userPassword: form.userPassword,
      checkPassword: form.checkPassword,
    })

    if (res?.code !== 0) {
      ElMessage.error(res?.message || '注册失败，请重试')
      return
    }

    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || '注册请求失败')
  } finally {
    loading.value = false
  }
}
</script>
