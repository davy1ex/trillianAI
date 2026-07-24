import { Router } from 'express'

const router = Router()

router.get('/', async (_req, res) => {
  const apiBase = process.env.LM_STUDIO_URL || 'http://localhost:1234'
  try {
    const response = await fetch(`${apiBase}/api/v1/models`)
    if (!response.ok) {
      return res.json([])
    }
    const data = await response.json() as any
    const models = (data.data ?? []).map((m: any) => ({
      key: m.id || m.model,
      provider: 'lmstudio',
    }))
    res.json(models)
  } catch {
    res.json([])
  }
})

router.get('/active', async (_req, res) => {
  res.json({
    key: process.env.MODEL_KEY || 'qwen/qwen3-4b-2507',
    provider: 'lmstudio',
    status: 'loaded',
  })
})

export { router as modelRoutes }
