import { app } from './app'

const port = Number(process.env.PORT || 3010)
app.listen(port, '0.0.0.0', () => {
  console.log(`DevSync Paperboy API listening on http://0.0.0.0:${port} (v2)`)
})
