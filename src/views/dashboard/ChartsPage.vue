<template>
  <div class="dashboard-page">
    <h1 class="page-title">我的图表</h1>
    <el-card shadow="never" class="empty-card">
      <el-empty>
        <template #description>
          <p>暂无图表数据</p>
          <p class="sub-desc">请先在智能分析页面创建图表</p>
        </template>
      </el-empty>
    </el-card>
  </div>
</template>
