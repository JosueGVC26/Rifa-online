const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Database = require('better-sqlite3');
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'troque-esta-senha';
const DATA_DIR = process.env.DATA_DIR || __dirname;
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'rifa.db'));
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS config(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS numbers(id INTEGER PRIMARY KEY,status TEXT NOT NULL DEFAULT 'available',name TEXT,phone TEXT,created_at TEXT,updated_at TEXT);`);
const insert = db.prepare('INSERT OR IGNORE INTO numbers(id,status) VALUES(?,?)');
const seed = db.transaction(() => { for (let i = 1; i <= 100; i++) insert.run(i, 'available'); }); seed();
const getConfig = k => db.prepare('SELECT value FROM config WHERE key=?').get(k)?.value || '';
const setConfig = (k, v) => db.prepare('INSERT INTO config(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, v);
for (const [k, v] of Object.entries({title:'Minha Rifa Online',price:'10,00',prize:'Prêmio da Rifa',drawDate:'',pixKey:'',pixQr:''})) setConfig(k, getConfig(k) || v);
const upload = multer({ dest: UPLOAD_DIR, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, /^image\/(png|jpeg|webp)$/.test(file.mimetype)) });
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (req, res) => res.json({ ok: true }));
function auth(req, res, next) { if (!ADMIN_PASSWORD || ADMIN_PASSWORD === 'troque-esta-senha' || req.headers['x-admin-password'] !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Senha inválida ou senha padrão ainda não alterada. Configure ADMIN_PASSWORD.' }); next(); }
app.get('/api/public', (req, res) => {
  const numbers = db.prepare('SELECT id,status FROM numbers ORDER BY id').all();
  res.json({ config: { title:getConfig('title'), price:getConfig('price'), prize:getConfig('prize'), drawDate:getConfig('drawDate'), pixKey:getConfig('pixKey'), pixQr:getConfig('pixQr') }, numbers });
});
app.get('/uploads/:file', (req, res) => {
  const file = path.basename(req.params.file);
  if (!/^pix-qr\.(png|jpg|jpeg|webp)$/.test(file)) return res.sendStatus(404);
  const filePath = path.join(UPLOAD_DIR, file);
  if (!fs.existsSync(filePath)) return res.sendStatus(404);
  res.sendFile(filePath);
});
app.post('/api/buy', (req, res) => {
  const id = Number(req.body.id), name = String(req.body.name || '').trim(), phone = String(req.body.phone || '').trim();
  if (!Number.isInteger(id) || id < 1 || id > 100 || name.length < 2 || name.length > 100 || phone.length < 8 || phone.length > 30) return res.status(400).json({ error:'Confira o número, nome e WhatsApp.' });
  const now = new Date().toISOString();
  const result = db.prepare("UPDATE numbers SET status='pending',name=?,phone=?,created_at=?,updated_at=? WHERE id=? AND status='available'").run(name, phone, now, now, id);
  if (!result.changes) return res.status(409).json({ error:'Este número não está mais disponível. Escolha outro.' });
  res.json({ ok:true, message:'Número reservado! Faça o Pix e envie o comprovante ao organizador. A reserva só será confirmada após conferência do pagamento.' });
});
app.get('/api/admin/numbers', auth, (req, res) => res.json(db.prepare('SELECT * FROM numbers ORDER BY id').all()));
app.post('/api/admin/status', auth, (req, res) => { const {id,status} = req.body; if (!Number.isInteger(Number(id)) || !['available','pending','paid'].includes(status)) return res.status(400).json({error:'Dados inválidos'}); db.prepare('UPDATE numbers SET status=?,updated_at=? WHERE id=?').run(status,new Date().toISOString(),Number(id)); res.json({ok:true}); });
app.post('/api/admin/config', auth, (req, res) => { for (const k of ['title','price','prize','drawDate','pixKey']) if (req.body[k] !== undefined) setConfig(k, String(req.body[k]).slice(0,500)); res.json({ok:true}); });
app.post('/api/admin/qr', auth, upload.single('qr'), (req, res) => {
  if (!req.file) return res.status(400).json({error:'Envie uma imagem PNG, JPG ou WEBP de até 5 MB.'});
  const ext = ({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'})[req.file.mimetype];
  for (const f of fs.readdirSync(UPLOAD_DIR)) if (/^pix-qr\.(png|jpg|jpeg|webp)$/.test(f)) fs.unlinkSync(path.join(UPLOAD_DIR,f));
  const dest = path.join(UPLOAD_DIR, `pix-qr.${ext}`); fs.renameSync(req.file.path,dest); setConfig('pixQr',`/uploads/pix-qr.${ext}`); res.json({ok:true,url:getConfig('pixQr')});
});
app.post('/api/admin/reset', auth, (req, res) => { db.prepare("UPDATE numbers SET status='available',name=NULL,phone=NULL,created_at=NULL,updated_at=?").run(new Date().toISOString()); res.json({ok:true}); });
app.listen(PORT, () => console.log(`Rifa Online rodando na porta ${PORT}`));
