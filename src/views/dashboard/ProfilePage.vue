<template>
  <div class="dashboard-page">
    <h1 class="page-title">个人中心</h1>

    <el-card shadow="never" class="profile-card">
      <div class="profile-header">
        <el-avatar :size="82" class="profile-avatar">{{ form.username.slice(0, 2).toUpperCase() }}</el-avatar>
        <div class="profile-meta">
          <div class="profile-top-row">
            <h2>{{ form.username }}</h2>
            <el-button type="primary" plain @click="isEditing = !isEditing">
              {{ isEditing ? '取消编辑' : '编辑资料' }}
            </el-button>
          </div>
          <el-form label-position="top" class="profile-form">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" :disabled="!isEditing" />
            </el-form-item>
            <el-form-item label="个人简介">
              <el-input v-model="form.bio" type="textarea" :rows="3" :disabled="!isEditing" />
            </el-form-item>
          </el-form>
          <el-button v-if="isEditing" type="success" @click="saveProfile">保存</el-button>
        </div>
      </div>
    </el-card>

    <div class="stat-grid">
      <el-card shadow="never"><div class="stat-num">12</div><div class="stat-label">创建的图表</div></el-card>
      <el-card shadow="never"><div class="stat-num">8</div><div class="stat-label">分析任务</div></el-card>
      <el-card shadow="never"><div class="stat-num">45</div><div class="stat-label">使用天数</div></el-card>
    </div>

    <el-card shadow="never">
      <template #header>最近活动</template>
      <el-timeline>
        <el-timeline-item timestamp="2026-04-22 15:30">创建了新图表：网站用户增长分析</el-timeline-item>
        <el-timeline-item timestamp="2026-04-21 10:15">完成了数据分析：销售趋势预测</el-timeline-item>
        <el-timeline-item timestamp="2026-04-20 14:20">上传了数据文件：sales_data.csv</el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

const isEditing = ref(false)
const form = reactive({
  username: 'Yupi',
  email: 'yupi@example.com',
  bio: '编程导航知识星球成员，热爱数据分析',
})

const saveProfile = () => {
  isEditing.value = false
  ElMessage.success('个人信息已保存')
}
</script>
