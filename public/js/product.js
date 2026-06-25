// ============ 获取 URL 参数 ============
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// ============ 加载产品详情 ============
async function loadProduct() {
  const wrapper = document.getElementById('detailWrapper');
  const id = getQueryParam('id');

  if (!id) {
    wrapper.innerHTML = '<p style="text-align:center;color:#f44336;padding:3rem;">缺少产品 ID 参数。</p>';
    document.title = '参数错误 - PawsJoy';
    return;
  }

  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) {
      wrapper.innerHTML = '<p style="text-align:center;color:#f44336;padding:3rem;">产品未找到。</p>';
      document.title = '产品未找到 - PawsJoy';
      return;
    }
    const p = await res.json();
    document.title = `${p.name} - PawsJoy`;

    wrapper.innerHTML = `
      <img
        class="detail-image"
        src="${p.image ? '/images/' + p.image : '/images/placeholder.svg'}"
        alt="${escapeHtml(p.name)}"
        onerror="this.src='/images/placeholder.svg'"
      >
      <div class="detail-info">
        ${p.category ? `<span class="detail-category">${escapeHtml(p.category)}</span>` : ''}
        <h2>${escapeHtml(p.name)}</h2>
        <div class="detail-price">${escapeHtml(p.price)}</div>
        <p class="detail-desc">${escapeHtml(p.description).replace(/\n/g, '<br>')}</p>
        ${p.amazonLink ? `
          <a href="${escapeHtml(p.amazonLink)}" target="_blank" rel="noopener" class="btn-amazon">
            <span class="cart-icon">🛒</span> 在亚马逊购买
          </a>
        ` : '<p style="color:#999;">购买链接暂未设置</p>'}
      </div>
    `;
  } catch (err) {
    wrapper.innerHTML = '<p style="text-align:center;color:#f44336;padding:3rem;">加载产品失败，请稍后再试。</p>';
    console.error('加载产品详情失败:', err);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

loadProduct();
