// Append migrations; never rewrite one that has shipped.
export const migrations = [
  String.raw`
CREATE TABLE note_types (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT NOT NULL, icon TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE emotions (id INTEGER PRIMARY KEY, name TEXT NOT NULL, icon TEXT NOT NULL, color TEXT, sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT NOT NULL, normalized_name TEXT NOT NULL UNIQUE);
CREATE TABLE notes (
 id INTEGER PRIMARY KEY, title TEXT NOT NULL CHECK(length(trim(title))>0), content TEXT NOT NULL DEFAULT '', search_title TEXT NOT NULL DEFAULT '', search_content TEXT NOT NULL DEFAULT '',
 note_type_id INTEGER NOT NULL REFERENCES note_types(id) ON DELETE RESTRICT,
 emotion_id INTEGER REFERENCES emotions(id) ON DELETE SET NULL, event_date TEXT,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived','deleted')),
 is_favorite INTEGER NOT NULL DEFAULT 0 CHECK(is_favorite IN (0,1)), is_pinned INTEGER NOT NULL DEFAULT 0 CHECK(is_pinned IN (0,1)),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
 CHECK((status='deleted' AND deleted_at IS NOT NULL) OR (status!='deleted' AND deleted_at IS NULL))
);
CREATE TABLE note_tags (note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE, tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY(note_id, tag_id));
CREATE TABLE attachments (
 id INTEGER PRIMARY KEY, note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
 type TEXT NOT NULL CHECK(type IN ('image','document','url')), title TEXT, path TEXT, url TEXT, mime_type TEXT,
 file_size INTEGER CHECK(file_size IS NULL OR file_size>=0), created_at TEXT NOT NULL,
 CHECK((type='url' AND url IS NOT NULL AND length(url)>0 AND path IS NULL) OR (type IN ('image','document') AND path IS NOT NULL AND length(path)>0 AND url IS NULL))
);
CREATE INDEX idx_notes_status_date ON notes(status, created_at DESC);
CREATE INDEX idx_notes_type ON notes(note_type_id);
CREATE INDEX idx_notes_emotion ON notes(emotion_id);
CREATE INDEX idx_notes_event ON notes(event_date);
CREATE INDEX idx_note_tags_tag ON note_tags(tag_id, note_id);
CREATE INDEX idx_attachments_note ON attachments(note_id);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO note_types(name,color,icon,sort_order) VALUES
 ('Особисте','#3B82F6','user',0),('Робота','#F59E0B','briefcase',1),('Ідеї','#A855F7','lightbulb-o',2),('Події','#22C55E','calendar',3),('Покупки','#EF4444','shopping-cart',4),('Навчання','#14B8A6','graduation-cap',5);
INSERT INTO emotions(name,icon,sort_order) VALUES ('Радість','😊',0),('Нейтрально','😐',1),('Сум','😔',2),('Досягнення','🎉',3),('Ідея','💡',4),('Важливо','⚠️',5);
`,
];
export const ftsSchema = `
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(title, content, content='notes', content_rowid='id', tokenize='unicode61');
CREATE TRIGGER IF NOT EXISTS notes_fts_insert AFTER INSERT ON notes BEGIN INSERT INTO notes_fts(rowid,title,content) VALUES(new.id,new.title,new.content); END;
CREATE TRIGGER IF NOT EXISTS notes_fts_delete AFTER DELETE ON notes BEGIN INSERT INTO notes_fts(notes_fts,rowid,title,content) VALUES('delete',old.id,old.title,old.content); END;
CREATE TRIGGER IF NOT EXISTS notes_fts_update AFTER UPDATE OF title,content ON notes BEGIN INSERT INTO notes_fts(notes_fts,rowid,title,content) VALUES('delete',old.id,old.title,old.content); INSERT INTO notes_fts(rowid,title,content) VALUES(new.id,new.title,new.content); END;
`;
