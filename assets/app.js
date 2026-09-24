(function () {
  'use strict';

  // —— 数据源：统一从 manifest.json 读取，新增教程只需改这个文件 ——
  var DATA_URL = 'data/manifest.json';
  var all = [];       // 原始教程列表
  var currentTag = ''; // 当前过滤的标签（'' 表示全部）

  var categoryListEl = document.getElementById('categoryList');
  var tagCloudEl = document.getElementById('tagCloud');
  var searchBox = document.getElementById('searchBox');
  var heroStats = document.getElementById('heroStats');

  // 初始化
  fetch(DATA_URL)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      all = data;
      renderStats();
      renderTags();
      render();
    })
    .catch(function () {
      categoryListEl.innerHTML =
        '<div class="empty">数据加载失败，请确认 <code>data/manifest.json</code> 存在且格式正确。</div>';
    });

  // 搜索输入
  searchBox.addEventListener('input', function () {
    currentTag = '';            // 搜索时重置标签过滤
    setActiveTags();
    render();
  });

  // 标签点击：切换过滤
  tagCloudEl.addEventListener('click', function (e) {
    var tagEl = e.target.closest('.tag');
    if (!tagEl) return;
    var t = tagEl.dataset.tag;
    currentTag = (currentTag === t) ? '' : t; // 再次点击取消过滤
    searchBox.value = '';                       // 标签过滤时不叠加搜索
    setActiveTags();
    render();
  });

  function setActiveTags() {
    Array.prototype.forEach.call(tagCloudEl.querySelectorAll('.tag'), function (el) {
      el.classList.toggle('active', el.dataset.tag === currentTag);
    });
  }

  // 头部统计
  function renderStats() {
    var cats = countBy(all, 'category');
    heroStats.textContent = '共 ' + all.length + ' 篇教程 · ' + cats.length + ' 个分类';
  }

  // 标签云
  function renderTags() {
    var counts = {};
    all.forEach(function (item) {
      (item.tags || []).forEach(function (tag) {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    var html = Object.keys(counts).sort().map(function (tag) {
      return '<span class="tag" data-tag="' + escapeHtml(tag) + '">' +
             escapeHtml(tag) + ' <small>(' + counts[tag] + ')</small></span>';
    }).join('');
    tagCloudEl.innerHTML = html || '<div class="empty">暂无标签</div>';
  }

  // 主渲染：分类分组 + 卡片
  function render() {
    var kw = searchBox.value.trim().toLowerCase();
    var filtered = all.filter(function (item) {
      var matchTag = !currentTag || (item.tags || []).indexOf(currentTag) > -1;
      var matchKw = !kw ||
        (item.title && item.title.toLowerCase().indexOf(kw) > -1) ||
        (item.desc && item.desc.toLowerCase().indexOf(kw) > -1) ||
        (item.tags || []).some(function (t) { return t.toLowerCase().indexOf(kw) > -1; }) ||
        (item.category && item.category.toLowerCase().indexOf(kw) > -1);
      return matchTag && matchKw;
    });

    if (!filtered.length) {
      categoryListEl.innerHTML = '<div class="empty">没有找到匹配的教程，换个关键词试试。</div>';
      return;
    }

    // 按分类分组
    var groups = {};
    filtered.forEach(function (item) {
      var c = item.category || '未分类';
      (groups[c] = groups[c] || []).push(item);
    });

    var cats = Object.keys(groups).sort();
    var total = filtered.length;

    // 仅过滤态注入动态标题；正常态沿用首页静态标题
    var html = '';
    if (currentTag || searchBox.value.trim()) {
      var label = currentTag ? ('标签：#' + currentTag) : ('搜索结果：' + searchBox.value.trim());
      html += '<div class="section-title">' + escapeHtml(label) +
              '<span class="count">' + total + ' 篇</span></div>';
    }

    cats.forEach(function (cat) {
      var items = groups[cat];
      html += '<div class="group">' +
                '<div class="group-head">' +
                  '<h3>' + escapeHtml(cat) + '</h3>' +
                  '<span class="group-count">' + items.length + ' 篇</span>' +
                  '<span class="group-line"></span>' +
                '</div>' +
                '<div class="cards">' +
                  items.map(cardHTML).join('') +
                '</div>' +
              '</div>';
    });
    categoryListEl.innerHTML = html;
  }

  function cardHTML(item) {
    return '<a class="card" href="' + escapeAttr(item.path) + '" target="_blank" rel="noopener">' +
             '<div class="card-title">' + escapeHtml(item.title) + '</div>' +
             '<div class="card-desc">' + escapeHtml(item.desc || '') + '</div>' +
             '<div class="card-meta">' +
               '<span class="chip cat">' + escapeHtml(item.category || '未分类') + '</span>' +
               (item.tags || []).slice(0, 3).map(function (t) {
                 return '<span class="chip">' + escapeHtml(t) + '</span>';
               }).join('') +
               (item.date ? '<span class="card-date">' + escapeHtml(item.date) + '</span>' : '') +
             '</div>' +
           '</a>';
  }

  // 工具：按字段计数
  function countBy(arr, key) {
    var map = {};
    arr.forEach(function (item) { map[item[key] || '未分类'] = 1; });
    return Object.keys(map);
  }

  // 工具：HTML 转义
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }
})();