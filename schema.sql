-- ============================================================
-- Football & Fighting — Cloudflare D1 Schema
-- Run: wrangler d1 execute FF_DB --file=schema.sql
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_member INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  avatar_color TEXT DEFAULT '#e50000',
  stripe_customer_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Sub-forums
CREATE TABLE IF NOT EXISTS subforums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT DEFAULT '💬',
  sort_order INTEGER DEFAULT 0,
  thread_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  last_activity TEXT
);

-- Threads
CREATE TABLE IF NOT EXISTS threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subforum_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_reply_at TEXT DEFAULT (datetime('now')),
  last_reply_user TEXT,
  FOREIGN KEY (subforum_id) REFERENCES subforums(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Replies
CREATE TABLE IF NOT EXISTS replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (thread_id) REFERENCES threads(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Upvotes (prevents duplicate voting)
CREATE TABLE IF NOT EXISTS upvotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  UNIQUE(user_id, target_type, target_id)
);

-- ============================================================
-- Seed sub-forums
-- ============================================================
INSERT OR IGNORE INTO subforums (slug, name, description, category, icon, sort_order) VALUES
('premier-league',    'Premier League',              'Match threads, table debates, VAR rage',                'football', '⚽', 1),
('transfer-rumours',  'Transfer Rumours & Gossip',   'The latest whispers, done deals, pure speculation',     'football', '🔥', 2),
('championship',      'Championship & Lower Leagues','EFL, non-league and everything below the top flight',   'football', '🏟️', 3),
('european-football', 'European Football',           'Champions League, Europa, international club football', 'football', '🌍', 4),
('international',     'International & World Cup',   'Internationals, World Cup, Euros, Nations League',      'football', '🏆', 5),
('ufc-mma',           'UFC & MMA',                   'Fight cards, results, rankings, fighter chat',          'combat',   '🥊', 6),
('boxing',            'Boxing',                      'World titles, British boxing, Fury, Joshua, Canelo',    'combat',   '🥊', 7),
('bkfc',              'Bare Knuckle Fighting',        'BKFC events, fighters, results and banter',            'combat',   '✊', 8),
('tips-football',     'Football Tips',               'Share your football tips — back your picks',            'betting',  '💰', 9),
('tips-combat',       'Combat Sports Tips',          'Boxing, UFC and BKFC betting tips',                     'betting',  '💰', 10),
('accumulators',      'Accumulators & Multis',       'Big accas, weekend multis, share your bets',           'betting',  '📊', 11),
('off-topic',         'Off Topic & Banter',          'Anything goes — keep it (mostly) clean',               'general',  '💬', 12),
('site-feedback',     'Site Feedback',               'Suggestions, bugs, ideas for the site',                'general',  '⚙️', 13);

-- ============================================================
-- Seed some starter threads so it doesn't look empty
-- ============================================================
INSERT OR IGNORE INTO users (id, username, email, password_hash, is_member, is_admin, post_count, avatar_color) VALUES
(1, 'Admin', 'admin@footballandfighting.com', 'changeme', 1, 1, 999, '#e50000');

INSERT OR IGNORE INTO threads (id, subforum_id, user_id, title, body, upvotes, reply_count, is_pinned) VALUES
(1, 1, 1, '🎉 Welcome to Football & Fighting Community', 'Welcome to the community! £1 gets you in and keeps the trolls out. Introduce yourself below — where are you from and who do you support?', 47, 0, 1),
(2, 2, 1, 'Summer transfer window megathread 2026', 'All the rumours, confirmed deals and pure gossip in one place. Drop your transfer news below.', 31, 0, 1),
(3, 6, 1, 'UFC 317 reaction thread', 'How did everyone rate the card? Post your thoughts.', 22, 0, 0),
(4, 7, 1, 'Zayas vs Ennis — June 27 predictions', 'Who wins and how? I've got Ennis by late stoppage — Zayas hasn''t faced anyone close to Boots'' level.', 38, 0, 0),
(5, 8, 1, 'Bare knuckle fighting — anyone else watching BKFC?', 'Came for the chaos, stayed because it''s actually brilliant. Who''s following it?', 19, 0, 0),
(6, 9, 1, 'Best value bets this weekend — share your picks', 'Drop your tips for the weekend fixtures. Back your analysis, not just your heart.', 28, 0, 1);
