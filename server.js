const express = require('express')
const app = express()
const db = require('./db')
const bcrypt = require('bcrypt')
const session = require('express-session')
const port = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }))
app.use(session({
  secret: 'qtc-secret-key',
  resave: false,
  saveUninitialized: false
}))

// Make user available in all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null
  next()
})

app.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY display_order').all()
  categories.forEach(cat => {
    cat.forums = db.prepare('SELECT * FROM forums WHERE category_id = ? ORDER BY display_order').all(cat.id)
  })
  res.render('index', { categories })
})

app.get('/forum/:id', (req, res) => {
  const forum = db.prepare('SELECT * FROM forums WHERE id = ?').get(req.params.id)
  if (!forum) return res.status(404).send('Forum not found')
  const threads = db.prepare(`
    SELECT threads.*, users.username
    FROM threads
    JOIN users ON threads.user_id = users.id
    WHERE threads.forum_id = ?
    ORDER BY threads.pinned DESC, threads.last_post_at DESC
  `).all(req.params.id)
  res.render('forum', { forum, threads })
})

app.get('/thread/:id', (req, res) => {
  const thread = db.prepare('SELECT * FROM threads WHERE id = ?').get(req.params.id)
  if (!thread) return res.status(404).send('Thread not found')
  const posts = db.prepare(`
    SELECT posts.*, users.username, users.member_type, users.joined_at, users.avatar
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.thread_id = ?
    ORDER BY posts.created_at ASC
  `).all(req.params.id)
  res.render('thread', { thread, posts })
})

app.get('/register', (req, res) => {
  res.render('register', { error: null })
})

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body
  if (!username || !email || !password) return res.render('register', { error: 'All fields required.' })
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email)
  if (existing) return res.render('register', { error: 'Username or email already taken.' })
  const hash = await bcrypt.hash(password, 10)
  const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hash)
  req.session.user = { id: result.lastInsertRowid, username, member_type: 'member' }
  res.redirect('/')
})

app.get('/login', (req, res) => {
  res.render('login', { error: null })
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user) return res.render('login', { error: 'Invalid username or password.' })
  const match = await bcrypt.compare(password, user.password)
  if (!match) return res.render('login', { error: 'Invalid username or password.' })
  req.session.user = { id: user.id, username: user.username, member_type: user.member_type }
  res.redirect('/')
})

app.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})
app.get('/forum/:id/new-thread', (req, res) => {
  if (!req.session.user) return res.redirect('/login')
  const forum = db.prepare('SELECT * FROM forums WHERE id = ?').get(req.params.id)
  if (!forum) return res.status(404).send('Forum not found')
  res.render('new-thread', { forum, error: null })
})

app.post('/forum/:id/new-thread', (req, res) => {
  if (!req.session.user) return res.redirect('/login')
  const { title, body } = req.body
  if (!title || !body) return res.render('new-thread', { forum: db.prepare('SELECT * FROM forums WHERE id = ?').get(req.params.id), error: 'Title and post body required.' })
  const thread = db.prepare('INSERT INTO threads (forum_id, user_id, title) VALUES (?, ?, ?)').run(req.params.id, req.session.user.id, title)
  db.prepare('INSERT INTO posts (thread_id, user_id, body) VALUES (?, ?, ?)').run(thread.lastInsertRowid, req.session.user.id, body)
  res.redirect('/thread/' + thread.lastInsertRowid)
})

app.post('/thread/:id/reply', (req, res) => {
  if (!req.session.user) return res.redirect('/login')
  const { body } = req.body
  if (!body) return res.redirect('/thread/' + req.params.id)
  db.prepare('INSERT INTO posts (thread_id, user_id, body) VALUES (?, ?, ?)').run(req.params.id, req.session.user.id, body)
  db.prepare('UPDATE threads SET last_post_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id)
  res.redirect('/thread/' + req.params.id)
})
app.listen(port, () => {
  console.log('Running on port ' + port)
})