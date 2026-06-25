const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// 持久化目录（通过环境变量配置，Zeabur 上设为绝对路径）
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const IMAGES_DIR = process.env.IMAGES_DIR || path.join(__dirname, 'public', 'images');

// 确保目录存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const DATA_FILE = path.join(DATA_DIR, 'products.json');

// ============ 工具函数：JSON 文件读写 ============

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // 文件不存在时（如 Zeabur Volume 首次挂载），返回默认数据并初始化
    const defaults = { products: [], contact: { email: '', phone: '', wechat: '', address: '' } };
    writeData(defaults);
    return defaults;
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ============ 中间件 ============

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// 图片访问路由（指向 IMAGES_DIR，本地默认 public/images，Zeabur 上指向 /storage/images）
app.use('/images', express.static(IMAGES_DIR));

// ============ 图片上传配置 ============

const storage = multer.diskStorage({
  destination: IMAGES_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 jpg, png, gif, webp 格式的图片'));
    }
  }
});

// ============ 产品 API ============

// 获取所有产品（支持 ?category=xxx 筛选，?featured=true 筛选）
app.get('/api/products', (req, res) => {
  const data = readData();
  let products = data.products;
  if (req.query.category) {
    products = products.filter(p => p.category === req.query.category);
  }
  if (req.query.featured === 'true') {
    products = products.filter(p => p.featured);
  }
  res.json(products);
});

// 获取单个产品
app.get('/api/products/:id', (req, res) => {
  const data = readData();
  const product = data.products.find(p => p.id == req.params.id);
  if (!product) {
    return res.status(404).json({ error: '产品不存在' });
  }
  res.json(product);
});

// 新增产品
app.post('/api/products', (req, res) => {
  const data = readData();
  const { name, summary, description, price, image, amazonLink, category, featured } = req.body;
  const maxId = data.products.reduce((max, p) => Math.max(max, p.id), 0);
  const newProduct = {
    id: maxId + 1,
    name: name || '',
    summary: summary || '',
    description: description || '',
    price: price || '',
    image: image || '',
    amazonLink: amazonLink || '',
    category: category || '',
    featured: featured || false
  };
  data.products.push(newProduct);
  writeData(data);
  res.status(201).json(newProduct);
});

// 更新产品
app.put('/api/products/:id', (req, res) => {
  const data = readData();
  const index = data.products.findIndex(p => p.id == req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '产品不存在' });
  }
  const allowed = ['name', 'summary', 'description', 'price', 'image', 'amazonLink', 'category', 'featured'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      data.products[index][key] = req.body[key];
    }
  }
  writeData(data);
  res.json(data.products[index]);
});

// 删除产品
app.delete('/api/products/:id', (req, res) => {
  const data = readData();
  const index = data.products.findIndex(p => p.id == req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '产品不存在' });
  }
  const deleted = data.products.splice(index, 1)[0];
  writeData(data);
  res.json({ message: '删除成功', product: deleted });
});

// 上传图片
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择图片文件' });
  }
  res.json({ filename: req.file.filename });
});

// ============ 联系方式 API ============

app.get('/api/contact', (req, res) => {
  const data = readData();
  res.json(data.contact);
});

app.put('/api/contact', (req, res) => {
  const data = readData();
  const allowed = ['email', 'phone', 'wechat', 'address'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      data.contact[key] = req.body[key];
    }
  }
  writeData(data);
  res.json(data.contact);
});

// ============ 启动服务器 ============

app.listen(PORT, () => {
  console.log(`服务器已启动：http://localhost:${PORT}`);
});
