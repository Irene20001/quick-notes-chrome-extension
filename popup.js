// ─────────────────────────────────────────
//  Quick Notes - popup.js
//  Features: CRUD, search, pin, dark mode,
//             export/import, char count
// ─────────────────────────────────────────

const NOTES_KEY = 'quick_notes_v2';   // version bump to avoid old-data conflicts
const PREFS_KEY  = 'quick_notes_prefs';

// ── Helpers ───────────────────────────────

function $id(id) { return document.getElementById(id); }

function formatTime(ts) {
  const d   = new Date(ts);
  const now = Date.now();
  const diff = now - ts;

  // < 1 min
  if (diff < 60_000)    return '刚刚';
  // < 1 hour
  if (diff < 3_600_000) {
    const m = Math.floor(diff / 60_000);
    return m + ' 分钟前';
  }
  // < 1 day
  if (diff < 86_400_000) {
    const h = Math.floor(diff / 3_600_000);
    return h + ' 小时前';
  }
  // ≥ 1 day → absolute date
  const M = (d.getMonth() + 1).toString().padStart(2, '0');
  const D = d.getDate().toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${d.getFullYear()}-${M}-${D} ${h}:${m}`;
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function charCount(text) {
  // Count Chinese chars + English words + punctuation as 1 each
  let chars = 0;
  for (const ch of text) { if (ch !== '\n') chars++; }
  return chars;
}

// ── Storage ───────────────────────────────

function loadAll(fn) {
  chrome.storage.local.get([NOTES_KEY, PREFS_KEY], (data) => {
    const notes  = data[NOTES_KEY]  || [];
    const prefs  = data[PREFS_KEY]   || { darkMode: false };
    fn(notes, prefs);
  });
}

function saveNotes(notes, fn) {
  chrome.storage.local.set({ [NOTES_KEY]: notes }, fn || (() => {}));
}

function savePrefs(prefs, fn) {
  chrome.storage.local.set({ [PREFS_KEY]: prefs }, fn || (() => {}));
}

// ── Render ────────────────────────────────

let allNotes = [];

function render() {
  const list      = $id('notesList');
  const emptyTip  = $id('emptyTip');
  const searchVal = $id('searchInput').value.trim().toLowerCase();
  const isDark    = document.body.classList.contains('dark');

  // Filter
  const filtered = searchVal
    ? allNotes.filter(n => n.text.toLowerCase().includes(searchVal))
    : allNotes;

  // Pinned first
  const pinned   = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);
  const ordered  = [...pinned, ...unpinned];

  // Stats
  const totalChars = allNotes.reduce((sum, n) => sum + charCount(n.text), 0);
  $id('totalNotes').textContent = `${allNotes.length} 条笔记`;
  $id('totalChars').textContent = `${totalChars} 字符`;

  if (allNotes.length === 0) {
    list.innerHTML = '<div class="empty" id="emptyTip">暂无笔记，写下第一条吧 ✨</div>';
    return;
  }

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty">没有找到匹配的笔记 🔍</div>';
    return;
  }

  list.innerHTML = '';

  ordered.forEach((note, _idx) => {
    const realIdx  = allNotes.indexOf(note);   // stable index into full array
    const cc       = charCount(note.text);
    const pinLabel = note.pinned ? '📌' : '📍';
    const pinClass = note.pinned ? 'active' : '';

    const div = document.createElement('div');
    div.className = 'note-item' + (note.pinned ? ' pinned' : '');
    div.dataset.idx = realIdx;

    div.innerHTML = `
      <div class="note-top">
        <span class="note-text">${escapeHtml(note.text)}</span>
        <button class="pin-btn ${pinClass}" data-idx="${realIdx}" title="${note.pinned ? '取消置顶' : '置顶笔记'}">${pinLabel}</button>
      </div>
      <div class="note-meta">
        <span class="note-time">${formatTime(note.time)}</span>
        <span class="note-chars">${cc} 字</span>
      </div>
      <button class="delete-btn" data-idx="${realIdx}" title="删除">✕</button>
    `;

    list.appendChild(div);
  });

  // Bind events
  list.querySelectorAll('.pin-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx);
      togglePin(idx);
    });
  });

  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx);
      deleteNote(idx);
    });
  });
}

// ── Actions ───────────────────────────────

function addNote() {
  const input = $id('noteInput');
  const text  = input.value.trim();
  if (!text) return;

  loadAll((notes) => {
    notes.push({ text, time: Date.now(), pinned: false });
    saveNotes(notes, () => {
      input.value = '';
      $id('inputChars').textContent = '0 字符';
      allNotes = notes;
      render();
    });
  });
}

function deleteNote(idx) {
  loadAll((notes) => {
    notes.splice(idx, 1);
    saveNotes(notes, () => {
      allNotes = notes;
      render();
    });
  });
}

function togglePin(idx) {
  loadAll((notes) => {
    notes[idx].pinned = !notes[idx].pinned;
    saveNotes(notes, () => {
      allNotes = notes;
      render();
    });
  });
}

function clearAll() {
  if (!confirm('确定要清空所有笔记吗？此操作不可撤销。')) return;
  saveNotes([], () => {
    allNotes = [];
    render();
  });
}

// ── Dark Mode ─────────────────────────────

function applyDarkMode(dark) {
  document.body.className = dark ? 'dark' : 'light';
  $id('darkToggle').textContent = dark ? '☀️' : '🌙';
  $id('darkToggle').title = dark ? '切换白天模式' : '切换深色模式';
  render();   // re-render to update dynamic styles
}

// ── Export ────────────────────────────────

function exportNotes() {
  if (allNotes.length === 0) {
    showToast('暂无笔记可导出');
    return;
  }

  const payload = JSON.stringify({ version: 2, notes: allNotes }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href     = url;
  a.download = `quick-notes-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
  showToast(`已导出 ${allNotes.length} 条笔记`);
}

// ── Import ────────────────────────────────

function importNotes() {
  $id('importFile').click();
}

$id('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);

      // Support both v1 array and v2 { notes: [] } format
      const incoming = Array.isArray(data) ? data : (data.notes || []);

      if (!Array.isArray(incoming)) throw new Error('格式错误');

      loadAll((existing) => {
        // Merge: skip exact duplicates (same text + time)
        const existingKeys = new Set(existing.map(n => `${n.text}||${n.time}`));
        const newOnes      = incoming.filter(n => !existingKeys.has(`${n.text}||${n.time}`));

        const merged  = [...existing, ...newOnes];
        const added   = newOnes.length;

        saveNotes(merged, () => {
          allNotes = merged;
          render();
          showToast(`成功导入 ${added} 条新笔记`);
        });
      });
    } catch (err) {
      showToast('导入失败：文件格式不正确');
    }

    // Reset so same file can be imported again
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ── Toast (no external deps) ─────────────

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toast.style.cssText = [
    'position:fixed', 'bottom:56px', 'left:50%', 'transform:translateX(-50%)',
    'background:#333', 'color:#fff', 'padding:7px 16px', 'border-radius:20px',
    'font-size:12px', 'z-index:9999', 'pointer-events:none', 'opacity:0',
    'transition:opacity 0.3s', 'white-space:nowrap'
  ].join(';');
  document.body.appendChild(toast);

  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ── Boot ─────────────────────────────────

loadAll((notes, prefs) => {
  allNotes = notes;
  applyDarkMode(prefs.darkMode);

  // Input char count
  $id('noteInput').addEventListener('input', (e) => {
    $id('inputChars').textContent = charCount(e.target.value) + ' 字符';
  });

  // Add note
  $id('addBtn').addEventListener('click', addNote);

  // Enter = save, Ctrl+Enter = newline
  $id('noteInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.ctrlKey) {
      e.preventDefault();
      addNote();
    }
  });

  // Search
  $id('searchInput').addEventListener('input', render);

  // Dark mode toggle
  $id('darkToggle').addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    const next   = !isDark;
    savePrefs({ darkMode: next }, () => applyDarkMode(next));
  });

  // Export / Import / Clear
  $id('exportBtn').addEventListener('click', exportNotes);
  $id('importBtn').addEventListener('click', importNotes);
  $id('clearAllBtn').addEventListener('click', clearAll);

  // Initial char count reset
  $id('inputChars').textContent = '0 字符';
});
