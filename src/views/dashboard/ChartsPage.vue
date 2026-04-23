<template>
  <div class="dashboard-page">
    <h1 class="page-title">我的图表</h1>

    <el-card shadow="never" class="search-bar-card">
      <el-input
        v-model="searchChartName"
        placeholder="请输入图表名称搜索"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </el-card>

    <div v-loading="loading">
      <el-empty v-if="!chartList.length" description="暂无图表数据">
        <template #description>
          <p>暂无图表数据</p>
          <p class="sub-desc">请先在智能分析页面创建图表</p>
        </template>
      </el-empty>

      <div v-else class="charts-grid">
        <el-card v-for="item in chartList" :key="item.id" shadow="never" class="chart-card">
          <div class="chart-user">
            <el-avatar :src="userProfile.userAvatar">
              {{ userInitials }}
            </el-avatar>
            <span class="chart-username">{{ userProfile.userName || userStore.userInfo.username }}</span>
          </div>

          <div class="chart-meta">
            <span class="meta-label">图表类型：</span>{{ formatChartType(item.chartType) }}
          </div>
          <div class="chart-meta">
            <span class="meta-label">分析目标：</span>{{ item.goal || '-' }}
          </div>

          <div class="chart-preview">
            <div v-if="chartErrorMap[item.id]" class="placeholder-text">{{ chartErrorMap[item.id] }}</div>
            <div
              v-else-if="item.genChart"
              :ref="(el) => setChartRef(item.id, el)"
              class="chart-canvas"
            />
            <div v-else class="placeholder-text">暂无图表数据</div>
          </div>
        </el-card>
      </div>

      <div v-if="total > pageSize" class="pager-wrap">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :current-page="current"
          :page-size="pageSize"
          :total="total"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()

const loading = ref(false)
const chartList = ref([])
const current = ref(1)
const pageSize = 10
const total = ref(0)
const searchChartName = ref('')

const userProfile = reactive({
  userName: userStore.userInfo.username || '用户',
  userAvatar: '',
})

const chartDomMap = new Map()
const chartInstanceMap = new Map()
const chartErrorMap = reactive({})

const userInitials = computed(() => (userProfile.userName || 'U').slice(0, 2).toUpperCase())

const formatChartType = (type) => {
  const map = {
    line: '折线图',
    bar: '柱状图',
    pie: '饼图',
    scatter: '散点图',
  }
  return map[type] || type || '-'
}

const setChartRef = (id, el) => {
  if (el) chartDomMap.set(id, el)
  else chartDomMap.delete(id)
}

const disposeAllCharts = () => {
  chartInstanceMap.forEach((instance) => instance.dispose())
  chartInstanceMap.clear()
}

const extractCode = (rawCode) => {
  if (!rawCode) return ''
  const trimmed = rawCode.trim()
  const match = trimmed.match(/```(?:javascript|js)?\s*([\s\S]*?)```/i)
  return match ? match[1].trim() : trimmed
}

const tryParseOptionJson = (code) => {
  try {
    const option = JSON.parse(code)
    return typeof option === 'object' && option ? option : null
  } catch {
    return null
  }
}

const renderSingleChart = (item) => {
  const dom = chartDomMap.get(item.id)
  if (!dom || !item.genChart) return

  const oldInstance = chartInstanceMap.get(item.id)
  if (oldInstance) oldInstance.dispose()

  chartErrorMap[item.id] = ''
  const chart = echarts.init(dom)
  chartInstanceMap.set(item.id, chart)

  const code = extractCode(item.genChart)
  const optionFromJson = tryParseOptionJson(code)
  if (optionFromJson) {
    chart.setOption(optionFromJson)
    return
  }

  try {
    const runner = new Function(
      'echarts',
      'chartDom',
      'myChart',
      `
      let option = null;
      ${code}
      if (option) {
        myChart.setOption(option);
      }
      `,
    )
    runner(echarts, dom, chart)
    const renderedOption = chart.getOption()
    if (!renderedOption || Object.keys(renderedOption).length === 0) {
      throw new Error('未生成可用图表配置')
    }
  } catch {
    chartErrorMap[item.id] = '图表渲染失败'
    chart.dispose()
    chartInstanceMap.delete(item.id)
  }
}

const renderAllCharts = async () => {
  await nextTick()
  chartList.value.forEach((item) => renderSingleChart(item))
}

const loadLoginUser = async () => {
  try {
    const res = await request.get('/user/get/login')
    if (res?.code === 0 && res.data) {
      userProfile.userName = res.data.userName || userProfile.userName
      userProfile.userAvatar = res.data.userAvatar || ''
    }
  } catch {
    // 用户信息拿不到时，回退到本地 store 昵称
  }
}

const loadCharts = async () => {
  loading.value = true
  disposeAllCharts()
  chartList.value = []

  try {
    const res = await request.post('/chart/my/list/page', {
      current: current.value,
      pageSize,
      chartName: searchChartName.value.trim(),
    })
    if (res?.code !== 0) {
      ElMessage.error(res?.message || '获取图表列表失败')
      return
    }

    const pageData = res.data || {}
    chartList.value = pageData.records || []
    total.value = Number(pageData.total || 0)
    await renderAllCharts()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || '获取图表列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  current.value = 1
  loadCharts()
}

const handlePageChange = (page) => {
  current.value = page
  loadCharts()
}

onMounted(async () => {
  await loadLoginUser()
  await loadCharts()
})

onBeforeUnmount(() => {
  disposeAllCharts()
})
</script>

<style scoped>
.search-bar-card {
  margin-bottom: 16px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.chart-card {
  min-height: 430px;
}

.chart-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.chart-username {
  font-weight: 600;
}

.chart-meta {
  margin-bottom: 8px;
  color: #4b5563;
}

.meta-label {
  color: #111827;
  font-weight: 600;
}

.chart-preview {
  margin-top: 8px;
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  padding: 10px;
  min-height: 300px;
  background: #fff;
}

.chart-canvas {
  width: 100%;
  height: 280px;
}

.pager-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
