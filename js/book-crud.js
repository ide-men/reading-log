// ========================================
// 本の追加・編集・削除
// ========================================
import { BOOK_STATUS } from './constants.js';
import { stateManager } from './state.js';
import { getCoverUrlFromLink } from './utils.js';
import { showToast, closeModal } from './ui.js';
import { persistAndRender } from './book-helpers.js';
import { renderBooks } from './book-rendering.js';

// ========================================
// 本の追加
// ========================================

// フォームからデータを取得
function getBookFormData() {
  return {
    title: document.getElementById('bookInput').value.trim(),
    link: document.getElementById('linkInput').value.trim(),
    comment: document.getElementById('bookCommentInput').value.trim()
  };
}

// 本のデータオブジェクトを作成
function createBookData(formData, status) {
  const { title, link, comment } = formData;
  const coverUrl = getCoverUrlFromLink(link, () => {
    showToast('短縮URL(amzn.asia等)では表紙画像を取得できません', 4000);
  });

  const today = new Date().toISOString().split('T')[0];

  // ステータスに応じて日付を設定
  let startedAt = null;
  let completedAt = null;
  if (status === BOOK_STATUS.READING) {
    startedAt = today;
  } else if (status === BOOK_STATUS.COMPLETED) {
    completedAt = today;
  }

  return {
    id: Date.now(),
    title,
    link: link || null,
    coverUrl,
    status,
    startedAt,
    completedAt,
    note: comment || null,
    readingTime: 0
  };
}

// フォームをクリア
function clearAddBookForm() {
  document.getElementById('bookInput').value = '';
  document.getElementById('bookCommentInput').value = '';
  document.getElementById('linkInput').value = '';
  document.getElementById('linkFields').classList.remove('open');
  document.getElementById('linkIcon').textContent = '+';
}

// ステータスに応じたメッセージを取得
const ADD_BOOK_MESSAGES = {
  [BOOK_STATUS.READING]: 'カバンに追加しました',
  [BOOK_STATUS.UNREAD]: '積読に追加しました',
  [BOOK_STATUS.COMPLETED]: '読了に追加しました',
  [BOOK_STATUS.DROPPED]: '中断に追加しました',
  [BOOK_STATUS.WISHLIST]: '本屋に追加しました'
};

export function addBook(status = BOOK_STATUS.READING) {
  const formData = getBookFormData();

  if (!formData.title) {
    showToast('タイトルを入力してください');
    return;
  }

  const bookData = createBookData(formData, status);
  stateManager.addBook(bookData);
  persistAndRender(renderBooks);

  clearAddBookForm();
  showToast(ADD_BOOK_MESSAGES[status] || '本を追加しました');

  // 続けて追加がOFFならモーダルを閉じる
  const continueAdd = document.getElementById('continueAddCheckbox').checked;
  if (!continueAdd) {
    closeModal('addBookModal');
  }
}

// ========================================
// 本の編集
// ========================================
export function editBook(id) {
  const book = stateManager.getBook(id);
  if (!book) return;

  stateManager.setEditingBookId(id);
  document.getElementById('editBookTitle').value = book.title;
  document.getElementById('editBookLink').value = book.link || '';
  document.getElementById('editBookStatus').value = book.status || BOOK_STATUS.COMPLETED;
  document.getElementById('editBookNote').value = book.note || '';
  document.getElementById('editBookModal').classList.add('active');
}

export function saveEditBook() {
  const editingBookId = stateManager.getEditingBookId();
  const title = document.getElementById('editBookTitle').value.trim();
  if (!title) {
    showToast('タイトルを入力してください');
    return;
  }

  const book = stateManager.getBook(editingBookId);
  if (book) {
    const newLink = document.getElementById('editBookLink').value.trim() || null;
    const updates = {
      title,
      status: document.getElementById('editBookStatus').value,
      note: document.getElementById('editBookNote').value.trim() || null
    };

    if (newLink !== book.link) {
      updates.link = newLink;
      updates.coverUrl = getCoverUrlFromLink(newLink, () => {
        showToast('短縮URLでは表紙画像を取得できません', 4000);
      });
    }

    stateManager.updateBook(editingBookId, updates);
    persistAndRender(renderBooks);
    showToast('保存しました');
  }
  closeModal('editBookModal');
}

// ========================================
// 本の削除
// ========================================
export function deleteBook(id) {
  const book = stateManager.getBook(id);
  if (!book) return;

  stateManager.setDeletingBookId(id);
  document.getElementById('deleteBookTitle').textContent = `「${book.title}」`;
  document.getElementById('deleteConfirm').classList.add('active');
}

export function confirmDeleteBook(updateUI) {
  const deletingBookId = stateManager.getDeletingBookId();
  stateManager.removeBook(deletingBookId);

  persistAndRender(renderBooks);
  updateUI();
  showToast('削除しました');
  closeModal('deleteConfirm');
}
