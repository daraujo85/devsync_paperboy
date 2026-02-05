import { app } from './app'

const port = Number(process.env.PORT || 3010)
app.listen(port, () => {
  console.log(`DevSync Paperboy API listening on http://localhost:${port} (v2)`)
})
