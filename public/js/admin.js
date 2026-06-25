// ============ 管理密码 ============
const ADMIN_PASSWORD = 'admin123';
let isLoggedIn = false;

// ============ 登录 ============
function login() {
  const input = document.getElementById('passwordInput').value;
  const errEl = document.getElementById('loginError');
  if (input === ADMIN_PASSWORD) {
    isLoggedIn = true;
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'block';
    loadProducts();
    loadContactForm();
  } else {
    errEl.textContent = '密码错误，请重试';
    errEl.style.display = 'block';
  }
}

function logout() {
  isLoggedIn = false;
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('adminSection').style.display = 'none';
  document.getElementById('passwordInput').value = '';
  document.getElementById('loginError').style.display = 'none';
}

// ============ 标签切换 ============
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[onclick="switchTab('${name}')"]`).classList.add('active');
  document.getElementById(`tab-${name}`).classList.add('active');
}

// ============ Toast 消息 ============
function showToast(msg, type) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ============ HTML 转义 ============
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ============ 产品列表 ============
async function loadProducts() {
  const tbody = document.getElementById('productTableBody');
  try {
    const res = await fetch('/api/products');
    const products = await res.json();

    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;padding:2rem;">暂无产品</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>
          <img src="${p.image ? '/images/' + p.image : '/images/placeholder.svg'}"
               alt="" style="width:50px;height:50px;object-fit:cover;border-radius:6px;"
               onerror="this.src='/images/placeholder.svg'">
        </td>
        <td>${esc(p.name)}</td>
        <td>${esc(p.price)}</td>
        <td>${esc(p.category)}</td>
        <td>${p.featured ? '⭐' : '—'}</td>
        <td>
          <div class="actions">
            <button class="btn btn-primary btn-sm" onclick="editProduct(${p.id})">编辑</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('加载产品失败', 'error');
    console.error(err);
  }
}

// ============ 显示新增表单 ============
function showAddForm() {
  document.getElementById('productForm').style.display = 'block';
  document.getElementById('formTitle').textContent = '新增产品';
  document.getElementById('productFormInner').reset();
  document.getElementById('prodId').value = '';
  document.getElementById('prodImageName').value = '';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('prodFeatured').value = 'false';
}

// ============ 隐藏表单 ============
function hideProductForm() {
  document.getElementById('productForm').style.display = 'none';
}

// ============ 编辑产品 ============
async function editProduct(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    const p = await res.json();

    document.getElementById('productForm').style.display = 'block';
    document.getElementById('formTitle').textContent = '编辑产品';
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodSummary').value = p.summary;
    document.getElementById('prodDesc').value = p.description;
    document.getElementById('prodAmazonLink').value = p.amazonLink;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodFeatured').value = p.featured ? 'true' : 'false';
    document.getElementById('prodImageName').value = p.image;

    const preview = document.getElementById('imagePreview');
    if (p.image) {
      preview.src = '/images/' + p.image;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }

    window.scrollTo({ top: document.getElementById('productForm').offsetTop - 80, behavior: 'smooth' });
  } catch (err) {
    showToast('加载产品失败', 'error');
    console.error(err);
  }
}

// ============ 保存产品 ============
async function saveProduct(event) {
  event.preventDefault();

  const id = document.getElementById('prodId').value;
  const imageFile = document.getElementById('prodImage').files[0];
  let imageName = document.getElementById('prodImageName').value;

  // 如果选择了新图片，先上传
  if (imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    try {
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        showToast(err.error || '图片上传失败', 'error');
        return;
      }
      const result = await uploadRes.json();
      imageName = result.filename;
      document.getElementById('prodImageName').value = imageName;
    } catch (err) {
      showToast('图片上传失败', 'error');
      return;
    }
  }

  const productData = {
    name: document.getElementById('prodName').value,
    price: document.getElementById('prodPrice').value,
    summary: document.getElementById('prodSummary').value,
    description: document.getElementById('prodDesc').value,
    amazonLink: document.getElementById('prodAmazonLink').value,
    category: document.getElementById('prodCategory').value,
    featured: document.getElementById('prodFeatured').value === 'true',
    image: imageName
  };

  try {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/products/${id}` : '/api/products';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.error || '保存失败', 'error');
      return;
    }

    showToast(id ? '产品更新成功！' : '产品添加成功！', 'success');
    hideProductForm();
    loadProducts();
  } catch (err) {
    showToast('保存失败', 'error');
    console.error(err);
  }
}

// ============ 删除产品 ============
async function deleteProduct(id) {
  if (!confirm('确定要删除这个产品吗？此操作不可恢复。')) return;

  try {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      showToast('删除失败', 'error');
      return;
    }
    showToast('产品已删除', 'success');
    loadProducts();
  } catch (err) {
    showToast('删除失败', 'error');
    console.error(err);
  }
}

// ============ 加载联系方式表单 ============
async function loadContactForm() {
  try {
    const res = await fetch('/api/contact');
    const c = await res.json();
    document.getElementById('contactEmail').value = c.email || '';
    document.getElementById('contactPhone').value = c.phone || '';
    document.getElementById('contactWechat').value = c.wechat || '';
    document.getElementById('contactAddress').value = c.address || '';
  } catch (err) {
    console.error('加载联系方式失败:', err);
  }
}

// ============ 保存联系方式 ============
async function saveContact(event) {
  event.preventDefault();
  const data = {
    email: document.getElementById('contactEmail').value,
    phone: document.getElementById('contactPhone').value,
    wechat: document.getElementById('contactWechat').value,
    address: document.getElementById('contactAddress').value
  };
  try {
    const res = await fetch('/api/contact', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('保存失败');
    showToast('联系方式已更新！', 'success');
  } catch (err) {
    showToast('保存联系方式失败', 'error');
    console.error(err);
  }
}

// ============ 图片预览 ============
document.getElementById('prodImage').addEventListener('change', function() {
  const file = this.files[0];
  const preview = document.getElementById('imagePreview');
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    preview.style.display = 'none';
  }
});
