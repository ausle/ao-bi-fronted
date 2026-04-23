<template>
  <div class="dashboard-page">
    <h1 class="page-title">智能分析</h1>
    <div class="analysis-grid">
      <el-card class="left-card" shadow="never">
        <el-form label-position="top" @submit.prevent>
          <el-form-item label="分析目标" required>
            <el-input
              v-model="form.analysisGoal"
              type="textarea"
              :rows="4"
              placeholder="请输入你的分析诉求，比如：分析网站增长情况"
            />
          </el-form-item>
          <el-form-item label="图表名称">
            <el-input v-model="form.chartName" placeholder="请输入图表名称" />
          </el-form-item>
          <el-form-item label="图表类型" required>
            <el-select v-model="form.chartType" placeholder="请选择图表类型" style="width: 100%">
              <el-option label="折线图" value="line" />
              <el-option label="柱状图" value="bar" />
              <el-option label="饼图" value="pie" />
              <el-option label="散点图" value="scatter" />
            </el-select>
          </el-form-item>
          <el-form-item label="图纸数据" required>
            <el-upload
              class="upload-box"
              drag
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              :on-change="handleFileChange"
              accept=".xlsx"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div>点击或拖拽上传数据分析文件</div>
              <div v-if="form.fileName" class="upload-name">{{ form.fileName }}</div>
            </el-upload>
          </el-form-item>
          <div class="form-actions">
            <el-button type="primary" :loading="isSubmitting" @click="handleSubmit">提交</el-button>
            <el-button :disabled="isSubmitting" @click="handleReset">重置</el-button>
          </div>
        </el-form>
      </el-card>

      <div class="right-col">
        <el-card shadow="never">
          <template #header>分析结论</template>
          <el-skeleton :loading="isSubmitting" animated>
            <template #template>
              <div class="placeholder-text">正在生成分析结论，请稍候...</div>
              <el-skeleton-item variant="text" style="margin-top: 10px; width: 90%" />
              <el-skeleton-item variant="text" style="margin-top: 8px; width: 72%" />
            </template>
            <template #default>
              <div class="placeholder-text">{{ analysisConclusion || '请先在左侧进行提交' }}</div>
            </template>
          </el-skeleton>
        </el-card>
        <el-card shadow="never">
          <template #header>可视化图表</template>
          <el-skeleton :loading="isSubmitting" animated>
            <template #template>
              <div class="placeholder-text">正在生成可视化图表，请稍候...</div>
              <el-skeleton-item variant="text" style="margin-top: 10px; width: 95%" />
              <el-skeleton-item variant="text" style="margin-top: 8px; width: 88%" />
              <el-skeleton-item variant="text" style="margin-top: 8px; width: 80%" />
            </template>
            <template #default>
              <div v-if="chartError" class="placeholder-text">{{ chartError }}</div>
              <!--
                ref 在默认插槽内：
                只有 skeleton 的 loading=false 时，这个节点才会渲染，
                否则 chartRef.value 会是 null。
              -->
              <div v-else-if="chartResult" ref="chartRef" style="width: 100%; height: 360px" />
              <div v-else class="placeholder-text">请先在左侧进行提交</div>
            </template>
          </el-skeleton>
        </el-card>
      </div>
    </div>

    <div class="page-footer">
      喜人同乐BI © 2026 喜人同乐知识星球出品
      <br />
      喜人同乐 xirentongle.cn
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import request from '../../utils/request'
import * as echarts from 'echarts'

const form = reactive({
  analysisGoal: '',
  chartName: '',
  chartType: '',
  fileName: '',
})
const analysisConclusion = ref('')
const chartResult = ref('')
const uploadedFile = ref(null)
// 控制提交按钮和 skeleton 加载态
const isSubmitting = ref(false)
// ECharts 挂载点（注意：在 skeleton default 插槽里）
const chartRef = ref(null)
const chartError = ref('')
let chartInstance = null

// 每次重新渲染前都销毁旧实例，避免重复 init / 内存泄漏
const disposeChart = () => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
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

const renderGeneratedChart = async (rawCode) => {
  // 调试时可保留，发布前可移除
  debugger
  disposeChart()
  chartError.value = ''
  const code = extractCode(rawCode)
  if (!code) return

  // 等待 DOM 更新，确保 ref 指向的容器已经存在
  await nextTick()
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)

  const optionFromJson = tryParseOptionJson(code)
  if (optionFromJson) {
    chartInstance.setOption(optionFromJson)
    return
  }

  try {
    // 兼容 AI 返回 JS 代码片段（不仅是纯 JSON）
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
    runner(echarts, chartRef.value, chartInstance)
    const renderedOption = chartInstance.getOption()
    if (!renderedOption || Object.keys(renderedOption).length === 0) {
      throw new Error('未生成可用图表配置')
    }
  } catch {
    chartError.value = '图表渲染失败，请检查 AI 返回的图表代码格式'
    disposeChart()
  }
}

const handleFileChange = (file) => {
  uploadedFile.value = file.raw || null
  form.fileName = file.name || ''
}

const handleSubmit = async () => {
  if (!form.analysisGoal) {
    ElMessage.warning('请填写分析目标')
    return
  }
  if (!uploadedFile.value) {
    ElMessage.warning('请上传数据分析文件')
    return
  }
  if (!form.chartType) {
    ElMessage.warning('请选择图表类型')
    return
  }

  const formData = new FormData()
  formData.append('file', uploadedFile.value)
  formData.append('name', form.chartName)
  formData.append('goal', form.analysisGoal)
  formData.append('chartType', form.chartType)

  isSubmitting.value = true
  analysisConclusion.value = ''
  chartResult.value = ''
  chartError.value = ''

  try {
    const res = await request.post('/chart/gen', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (res?.code !== 0) {
      ElMessage.error(res?.message || '分析失败，请稍后重试')
      return
    }

    const data = res.data || {}
    analysisConclusion.value = data.genResult || '暂无分析结论'
    chartResult.value = data.genChart || '暂无图表结果'

    // 关键点：
    // loading=true 时 skeleton 不会渲染 default 插槽，chartRef 会是 null。
    // 因此先关闭 loading，再等待一轮 DOM 更新后再渲染图表。
    isSubmitting.value = false
    await nextTick()
    await renderGeneratedChart(chartResult.value)
    ElMessage.success('分析成功')
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || '请求失败，请检查后端服务')
  } finally {
    isSubmitting.value = false
  }
}

const handleReset = () => {
  form.analysisGoal = ''
  form.chartName = ''
  form.chartType = ''
  form.fileName = ''
  uploadedFile.value = null
  analysisConclusion.value = ''
  chartResult.value = ''
  chartError.value = ''
  disposeChart()
}

onBeforeUnmount(() => {
  disposeChart()
})
</script>
