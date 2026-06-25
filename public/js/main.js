// ============ 加载产品列表 ============
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  try {
    const res = await fetch('/api/products');
    const products = await res.json();

    if (!products.length) {
      grid.innerHTML = '<p style="text-align:center;color:#999;padding:2rem;">暂无产品，请先通过管理后台添加。</p>';
      return;
    }

    grid.innerHTML = products.map(p => `
      <div class="product-card" onclick="goToDetail(${p.id})">
        <img
          class="card-img"
          src="${p.image ? '/images/' + p.image : '/images/placeholder.svg'}"
          alt="${p.name}"
          onerror="this.src='/images/placeholder.svg'"
        >
        <div class="card-body">
          <h3>${escapeHtml(p.name)}</h3>
          <p>${escapeHtml(p.summary)}</p>
          <span class="price">${escapeHtml(p.price)}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = '<p style="text-align:center;color:#f44336;padding:2rem;">加载产品失败，请稍后再试。</p>';
    console.error('加载产品失败:', err);
  }
}

// ============ 加载联系方式 ============
async function loadContact() {
  const footerContact = document.getElementById('footerContact');
  try {
    const res = await fetch('/api/contact');
    const contact = await res.json();
    const items = [];
    if (contact.email) items.push(`<li>📧 邮箱：${escapeHtml(contact.email)}</li>`);
    if (contact.phone) items.push(`<li>📞 电话：${escapeHtml(contact.phone)}</li>`);
    if (contact.wechat) items.push(`<li>💬 微信：${escapeHtml(contact.wechat)}</li>`);
    if (contact.address) items.push(`<li>📍 地址：${escapeHtml(contact.address)}</li>`);
    footerContact.innerHTML = items.length
      ? items.join('')
      : '<li>联系方式待更新</li>';
  } catch (err) {
    footerContact.innerHTML = '<li>联系方式加载失败</li>';
    console.error('加载联系方式失败:', err);
  }
}

// ============ 跳转详情页 ============
function goToDetail(id) {
  window.location.href = `product.html?id=${id}`;
}

// ============ HTML 转义 ============
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============ 页面初始化 ============
loadProducts();
loadContact();
