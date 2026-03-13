const db = require('./db')

// Categories
const cat1 = db.prepare('INSERT INTO categories (name, display_order) VALUES (?, ?)').run('Music', 1)
const cat2 = db.prepare('INSERT INTO categories (name, display_order) VALUES (?, ?)').run('Quiet Theory', 2)

// Forums
db.prepare('INSERT INTO forums (category_id, name, description, display_order) VALUES (?, ?, ?, ?)')
  .run(cat1.lastInsertRowid, 'Albums', 'Recommendations, deep dives, and discussion about records.', 1)
db.prepare('INSERT INTO forums (category_id, name, description, display_order) VALUES (?, ?, ?, ?)')
  .run(cat1.lastInsertRowid, 'Artists', 'Talk about the people making the music.', 2)
db.prepare('INSERT INTO forums (category_id, name, description, display_order) VALUES (?, ?, ?, ?)')
  .run(cat1.lastInsertRowid, 'Listening', 'What are you playing right now?', 3)
db.prepare('INSERT INTO forums (category_id, name, description, display_order) VALUES (?, ?, ?, ?)')
  .run(cat2.lastInsertRowid, 'Releases', 'Quiet Theory Records releases and campaigns.', 1)
db.prepare('INSERT INTO forums (category_id, name, description, display_order) VALUES (?, ?, ?, ?)')
  .run(cat2.lastInsertRowid, 'Meta', 'Forum feedback, announcements, and housekeeping.', 2)

console.log('Seeded.')