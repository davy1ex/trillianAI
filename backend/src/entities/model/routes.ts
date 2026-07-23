import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.json([
    {
      key: process.env.MODEL_KEY || 'qwen/qwen3-4b-2507',
      provider: 'lmstudio',
    },
  ])
})

router.get('/active', async (_req, res) => {
  res.json({
    key: process.env.MODEL_KEY || 'qwen/qwen3-4b-2507',
    provider: 'lmstudio',
    status: 'loaded',
  })
})

export { router as modelRoutes }
