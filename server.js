const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Quiet Theory Club — coming soon')
})

app.listen(port, () => {
  console.log('Running on port ' + port)
})