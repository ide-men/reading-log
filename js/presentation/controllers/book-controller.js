// ========================================
// Book Controller
// 本のCRUD・ステータス変更の制御
// ========================================
import { BOOK_STATUS, UI_CONFIG, CELEBRATION_CONFIG } from '../../shared/constants.js';
import { openLink, escapeHtml } from '../../shared/utils.js';
import * as bookService from '../../domain/book/book-service.js';
import * as bookRepository from '../../domain/book/book-repository.js';
import { checkDuplicateTitlePure, checkDuplicateLinkPure } from '../../domain/book/book-entity.js';
import { stateManager } from '../../core/state-manager.js';
import { showAcquireCelebration } from '../effects/celebrations.js';
import { renderReadingBooks, selectBook, updateCarouselScrollState, selectCenteredBook } from '../views/carousel-view.js';
import { renderStudyBooks, renderLabelFilterOptions } from '../views/study-view.js';
import { renderStoreBooks } from '../views/store-view.js';
import { openBookDetail } from '../views/shared.js';
import { showToast, closeModal, openModal, renderBooks, updateUI, openLabelManager } from './navigation.js';
import { initModalValidation, updateButtonState } from '../utils/modal-validation.js';
import { initClearButtons } from '../utils/form-clear-button.js';
import {
  getAllLabels,
  getBookLabels,
  setBookLabels,
  addLabel as addNewLabel
} from '../../domain/label/label-service.js';

// ========================================
// 本の追加
// ========================================
export function addBook(status = BOOK_STATUS.READING) {
  const bookInput = document.getElementById('bookInput');
  const linkInput = document.getElementById('linkInput');
  const bookCommentInput = document.getElementById('bookCommentInput');
  const continueAddCheckbox = document.getElementById('continueAddCheckbox');

  // DOM要素が存在しない場合は早期リターン
  if (!bookInput) {
    console.error('addBook: Required DOM element not found');
    return;
  }

  const title = bookInput.value.trim();
  const link = linkInput?.value.trim() || '';
  const triggerNote = bookCommentInput?.value.trim() || '';

  const result = bookService.addBook({ title, link, triggerNote, status });

  if (!result.success) {
    showToast(result.message);
    return;
  }

  // 追加された本にラベルを設定
  if (result.book && addSelectedLabelIds.length > 0) {
    setBookLabels(result.book.id, addSelectedLabelIds);
  }

  // フォームをクリア
  bookInput.value = '';
  if (bookCommentInput) bookCommentInput.value = '';
  if (linkInput) linkInput.value = '';

  // ラベル選択状態もクリア
  addSelectedLabelIds = [];
  renderAddLabelSelector();

  // エラーメッセージもクリア
  const bookInputError = document.getElementById('bookInputError');
  const linkInputError = document.getElementById('linkInputError');
  if (bookInputError) bookInputError.style.display = 'none';
  if (linkInputError) linkInputError.style.display = 'none';

  renderBooks();
  showToast(result.message);

  // 続けて追加がOFFならモーダルを閉じる
  const continueAdd = continueAddCheckbox?.checked ?? false;
  if (!continueAdd) {
    closeModal('addBookModal');
  }
}

// ========================================
// 本の編集
// ========================================
// 編集モーダル用のラベル選択状態
let editSelectedLabelIds = [];

// 追加モーダル用のラベル選択状態
let addSelectedLabelIds = [];

export function editBook(id) {
  const book = bookRepository.getBookById(id);
  if (!book) return;

  const editBookTitle = document.getElementById('editBookTitle');
  const editBookLink = document.getElementById('editBookLink');
  const editBookStatus = document.getElementById('editBookStatus');
  const editBookNote = document.getElementById('editBookNote');

  if (!editBookTitle) {
    console.error('editBook: Required DOM element not found');
    return;
  }

  stateManager.setEditingBookId(id);
  editBookTitle.value = book.title;
  if (editBookLink) editBookLink.value = book.link || '';
  if (editBookStatus) editBookStatus.value = book.status || BOOK_STATUS.COMPLETED;
  if (editBookNote) editBookNote.value = book.triggerNote || '';

  // ラベル選択状態を初期化
  editSelectedLabelIds = [...(book.labelIds || [])];
  renderEditLabelSelector();

  openModal('editBookModal');

  // バリデーション状態を更新
  updateButtonState('saveEditBtn', ['editBookTitle']);
}

export function saveEditBook() {
  const editingBookId = stateManager.getEditingBookId();
  if (!editingBookId) return;

  const editBookTitle = document.getElementById('editBookTitle');
  const editBookLink = document.getElementById('editBookLink');
  const editBookStatus = document.getElementById('editBookStatus');
  const editBookNote = document.getElementById('editBookNote');

  if (!editBookTitle) {
    console.error('saveEditBook: Required DOM element not found');
    return;
  }

  const title = editBookTitle.value.trim();
  const link = editBookLink?.value.trim() || null;
  const status = editBookStatus?.value || BOOK_STATUS.COMPLETED;
  const triggerNote = editBookNote?.value.trim() || null;

  const result = bookService.editBook(editingBookId, { title, link, status, triggerNote });

  if (!result.success) {
    showToast(result.message);
    return;
  }

  // ラベルを保存
  setBookLabels(editingBookId, editSelectedLabelIds);

  renderBooks();
  showToast(result.message);
  closeModal('editBookModal');
}

// ========================================
// 本の削除
// ========================================
export function deleteBook(id) {
  const book = bookRepository.getBookById(id);
  if (!book) return;

  stateManager.setDeletingBookId(id);
  document.getElementById('deleteBookTitle').textContent = `「${book.title}」`;
  openModal('deleteConfirm');
}

export function confirmDeleteBook() {
  const deletingBookId = stateManager.getDeletingBookId();
  const result = bookService.deleteBook(deletingBookId);

  if (result.success) {
    renderBooks();
    updateUI();
    showToast(result.message);
  }
  closeModal('deleteConfirm');
}

// ========================================
// ステータス遷移
// ========================================

// wishlist → unread（書斎に入れる）
export function acquireBook(id) {
  const result = bookService.acquireBook(id);
  if (!result.success) return;

  showAcquireCelebration(result.book, result.destination, () => {
    showToast('書斎の未読に追加しました！');
  });

  setTimeout(() => {
    result.applyUpdate();
    renderBooks();
  }, CELEBRATION_CONFIG.statusUpdateDelay);
}

// wishlist → reading（カバンに入れる）
export function moveToReading(id) {
  const result = bookService.moveToReading(id);
  if (!result.success) return;

  showAcquireCelebration(result.book, result.destination, () => {
    showToast('カバンに追加しました！');
  });

  setTimeout(() => {
    result.applyUpdate();
    renderBooks();
  }, CELEBRATION_CONFIG.statusUpdateDelay);
}

// unread/dropped/completed → reading（読み始める・再読！）
export function startReadingBook(id) {
  const result = bookService.startReadingBook(id);
  if (result.success) {
    renderBooks();
    showToast(result.message);
  }
}

// reading → completed（読み終わった！）
export function completeBook(id) {
  const result = bookService.completeBook(id);
  if (!result.success) return;

  showAcquireCelebration(result.book, result.destination, () => {
    // セレブレーション終了後に感想モーダルを表示
    openCompleteNoteModal(id, result.book);
  });

  setTimeout(() => {
    result.applyUpdate();
    renderBooks();
  }, CELEBRATION_CONFIG.statusUpdateDelay);
}

// 読了時の感想モーダルを開く
export function openCompleteNoteModal(id, book) {
  stateManager.setReadingNoteBookId(id);
  document.getElementById('completeNoteBookTitle').textContent = book.title;
  document.getElementById('completeNoteInput').value = book.completionNote || '';
  openModal('completeNoteModal');

  // バリデーション状態を更新（任意のみなので入力がない場合は非活性）
  updateButtonState('saveCompleteNoteBtn', [], ['completeNoteInput']);
}

// 読了感想を保存
export function saveCompleteNote() {
  const bookId = stateManager.getReadingNoteBookId();
  if (!bookId) return;

  const completionNote = document.getElementById('completeNoteInput').value.trim() || null;
  bookService.saveCompletionNote(bookId, completionNote);

  closeModal('completeNoteModal');
  showToast('保存しました');
  renderBooks();
}

export function skipCompleteNote() {
  closeModal('completeNoteModal');
  showToast('読了おめでとうございます！');
}

// reading → dropped（中断）- モーダルを開く
export function openDropBookModal(id) {
  const book = bookRepository.getBookById(id);
  if (!book) return;

  stateManager.setDroppingBookId(id);
  document.getElementById('dropBookTitle').textContent = book.title;
  document.getElementById('bookmarkInput').value = '';
  openModal('dropBookModal');

  // バリデーション状態を更新（任意のみなので入力がない場合は非活性）
  updateButtonState('confirmDropBtn', [], ['bookmarkInput']);
}

// 中断を確定
export function confirmDropBook() {
  const droppingBookId = stateManager.getDroppingBookId();
  if (!droppingBookId) return;

  const bookmark = document.getElementById('bookmarkInput').value.trim() || null;
  const result = bookService.dropBook(droppingBookId, bookmark);

  if (result.success) {
    renderBooks();
    showToast(result.message);
  }
  closeModal('dropBookModal');
}

// ========================================
// イベント委譲ユーティリティ
// ========================================
function delegateEvents(container, eventType, handlers, fallback = null) {
  container.addEventListener(eventType, (e) => {
    for (const { selector, handler, stopPropagation, preventDefault } of handlers) {
      const target = e.target.closest(selector);
      if (target) {
        if (stopPropagation) e.stopPropagation();
        if (preventDefault) e.preventDefault();
        handler(e, target);
        return;
      }
    }
    if (fallback) {
      fallback(e);
    }
  });
}

// ========================================
// 書斎のイベントハンドラ
// ========================================
const studyBookListHandlers = [
  {
    selector: '[data-close-detail]',
    handler: () => {
      stateManager.clearStudySelection();
      renderStudyBooks();
    }
  },
  {
    selector: '[data-reunion]',
    stopPropagation: true,
    handler: (e, target) => {
      stateManager.clearStudySelection();
      openReunionModal(Number(target.dataset.reunion));
    }
  },
  {
    selector: '[data-start]',
    stopPropagation: true,
    handler: (e, target) => {
      stateManager.clearStudySelection();
      startReadingBook(Number(target.dataset.start));
    }
  },
  {
    selector: '[data-link]',
    preventDefault: true,
    handler: (e, target) => {
      openLink(target.dataset.link);
    }
  },
  {
    selector: '[data-edit]',
    handler: (e, target) => {
      stateManager.clearStudySelection();
      editBook(Number(target.dataset.edit));
    }
  },
  {
    selector: '[data-delete]',
    handler: (e, target) => {
      stateManager.clearStudySelection();
      deleteBook(Number(target.dataset.delete));
    }
  }
];

function studyBookListFallback(e) {
  const card = e.target.closest('.book-card');
  if (card && card.dataset.bookId) {
    openBookDetail(Number(card.dataset.bookId));
  }
}

// ========================================
// 本屋のイベントハンドラ
// ========================================
const storeBookListHandlers = [
  {
    selector: '[data-close-detail]',
    handler: () => {
      stateManager.clearStoreSelection();
      renderStoreBooks();
    }
  },
  {
    selector: '[data-to-study]',
    handler: (e, target) => {
      stateManager.clearStoreSelection();
      acquireBook(Number(target.dataset.toStudy));
    }
  },
  {
    selector: '[data-to-bag]',
    handler: (e, target) => {
      stateManager.clearStoreSelection();
      moveToReading(Number(target.dataset.toBag));
    }
  },
  {
    selector: '[data-link]',
    preventDefault: true,
    handler: (e, target) => {
      openLink(target.dataset.link);
    }
  },
  {
    selector: '[data-edit]',
    handler: (e, target) => {
      stateManager.clearStoreSelection();
      editBook(Number(target.dataset.edit));
    }
  },
  {
    selector: '[data-delete]',
    handler: (e, target) => {
      stateManager.clearStoreSelection();
      deleteBook(Number(target.dataset.delete));
    }
  }
];

function storeBookListFallback(e) {
  const card = e.target.closest('.book-card');
  if (card && card.dataset.bookId) {
    openBookDetail(Number(card.dataset.bookId));
  }
}

// ========================================
// 共通シェルフイベント設定
// ========================================
function initShelfEvents(config) {
  const { shelfId, bookListId, miniBookClass, handlers, fallback, getSelectedId, setSelectedId, clearSelection, renderFn } = config;

  delegateEvents(
    document.getElementById(bookListId),
    'click',
    handlers,
    fallback
  );

  let lastClickTime = 0;
  document.getElementById(shelfId).addEventListener('click', (e) => {
    const now = Date.now();
    if (now - lastClickTime < UI_CONFIG.debounceInterval) return;
    lastClickTime = now;

    const miniBook = e.target.closest(`.${miniBookClass}`);
    if (!miniBook) return;

    const bookId = Number(miniBook.dataset.bookId);
    if (!bookId) return;

    if (getSelectedId() === bookId) {
      miniBook.classList.remove('selected');
      clearSelection();
      setTimeout(renderFn, 200);
    } else {
      setSelectedId(bookId);
      renderFn();
    }
  });
}

// ========================================
// 本追加モーダルを開く（共通関数）
// ========================================
function openAddBookModalWithStatus(status) {
  const titleMap = {
    [BOOK_STATUS.READING]: 'カバンに本を追加',
    [BOOK_STATUS.UNREAD]: '書斎に本を追加',
    [BOOK_STATUS.WISHLIST]: '本屋に本を追加'
  };

  document.getElementById('addBookModalTitle').textContent = titleMap[status] || '本を追加';
  document.getElementById('addBookStatus').value = status;

  const statusSelector = document.getElementById('studyStatusSelector');
  if (status === BOOK_STATUS.UNREAD) {
    statusSelector.style.display = 'block';
    document.querySelector('input[name="studyStatus"][value="unread"]').checked = true;
  } else {
    statusSelector.style.display = 'none';
  }

  // ラベル選択状態を初期化
  addSelectedLabelIds = [];
  renderAddLabelSelector();

  openModal('addBookModal');

  // バリデーション状態を更新
  updateButtonState('addBookBtn', ['bookInput']);
}

// ========================================
// 本の追加イベント初期化
// ========================================
export function initAddBookEvents() {
  const fab = document.getElementById('addBookFab');
  fab.addEventListener('click', () => {
    const activeTab = document.querySelector('.nav button.active');
    const tabName = activeTab?.dataset.tab || 'home';

    const statusMap = {
      home: BOOK_STATUS.READING,
      study: BOOK_STATUS.UNREAD,
      store: BOOK_STATUS.WISHLIST
    };

    const status = statusMap[tabName] || BOOK_STATUS.READING;
    openAddBookModalWithStatus(status);
  });

  // 空状態のプラスボタンのイベント（イベント委譲）
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add-book]');
    if (!addBtn) return;

    const statusType = addBtn.dataset.addBook;
    const statusMap = {
      reading: BOOK_STATUS.READING,
      unread: BOOK_STATUS.UNREAD,
      wishlist: BOOK_STATUS.WISHLIST
    };

    const status = statusMap[statusType] || BOOK_STATUS.READING;
    openAddBookModalWithStatus(status);
  });

  document.querySelectorAll('input[name="studyStatus"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.getElementById('addBookStatus').value = e.target.value;
    });
  });

  document.getElementById('addBookBtn').addEventListener('click', () => {
    const status = document.getElementById('addBookStatus').value;
    addBook(status);
  });

  // バリデーションを初期化（入力イベントでボタン状態を更新）
  initModalValidation({
    modalId: 'addBookModal',
    buttonId: 'addBookBtn',
    requiredFields: ['bookInput'],
    optionalFields: []
  });

  // タイトル入力時にAmazon検索リンクを更新
  // <a>タグのhrefを直接設定し、通常のリンククリック動作でブラウザを開く（PWA対応）
  const bookInput = document.getElementById('bookInput');
  const linkInput = document.getElementById('linkInput');
  const amazonSearchLink = document.getElementById('amazonSearchLink');
  const bookInputError = document.getElementById('bookInputError');
  const linkInputError = document.getElementById('linkInputError');
  const addBookBtn = document.getElementById('addBookBtn');

  // 重複バリデーション状態を追跡
  let hasTitleDuplicate = false;
  let hasLinkDuplicate = false;

  // 追加ボタンの状態を更新
  function updateAddBookButtonState() {
    const title = bookInput.value.trim();
    const hasTitle = title !== '';
    addBookBtn.disabled = !hasTitle || hasTitleDuplicate || hasLinkDuplicate;
  }

  // タイトル重複チェック
  function validateTitleDuplicate() {
    const title = bookInput.value.trim();
    if (!title) {
      hasTitleDuplicate = false;
      bookInputError.style.display = 'none';
      return;
    }

    const existingBooks = bookRepository.getAllBooks();
    const result = checkDuplicateTitlePure(title, existingBooks);

    if (result.isDuplicate) {
      hasTitleDuplicate = true;
      bookInputError.textContent = `「${result.duplicateBook.title}」は既に登録されています`;
      bookInputError.style.display = 'block';
    } else {
      hasTitleDuplicate = false;
      bookInputError.style.display = 'none';
    }
  }

  // リンク重複チェック
  function validateLinkDuplicate() {
    const link = linkInput.value.trim();
    if (!link) {
      hasLinkDuplicate = false;
      linkInputError.style.display = 'none';
      return;
    }

    const existingBooks = bookRepository.getAllBooks();
    const result = checkDuplicateLinkPure(link, existingBooks);

    if (result.isDuplicate) {
      hasLinkDuplicate = true;
      linkInputError.textContent = `このリンクは「${result.duplicateBook.title}」で既に登録されています`;
      linkInputError.style.display = 'block';
    } else {
      hasLinkDuplicate = false;
      linkInputError.style.display = 'none';
    }
  }

  bookInput.addEventListener('input', () => {
    const title = bookInput.value.trim();
    if (title) {
      const searchUrl = `https://www.amazon.co.jp/gp/aw/s/ref=is_s?k=${encodeURIComponent(title)}`;
      amazonSearchLink.href = searchUrl;
      amazonSearchLink.style.display = 'inline-block';
    } else {
      amazonSearchLink.href = '#';
      amazonSearchLink.style.display = 'none';
    }

    // 重複バリデーション
    validateTitleDuplicate();
    updateAddBookButtonState();
  });

  linkInput.addEventListener('input', () => {
    validateLinkDuplicate();
    updateAddBookButtonState();
  });

  // 「なぜこの本？」トグル
  const triggerNoteToggle = document.getElementById('triggerNoteToggle');
  const triggerNoteGroup = document.getElementById('triggerNoteGroup');
  const triggerNoteIcon = triggerNoteToggle.querySelector('.optional-field-toggle__icon');

  triggerNoteToggle.addEventListener('click', () => {
    const isHidden = triggerNoteGroup.style.display === 'none';
    triggerNoteGroup.style.display = isHidden ? 'block' : 'none';
    triggerNoteIcon.textContent = isHidden ? '−' : '+';
    if (isHidden) {
      document.getElementById('bookCommentInput').focus();
    }
  });

  // クリアボタンを初期化
  initClearButtons(['bookInput', 'linkInput', 'bookCommentInput']);

  // ラベルセレクターのイベント初期化
  initAddLabelSelectorEvents();
}

// ========================================
// 本の編集・削除イベント初期化
// ========================================
export function initEditDeleteEvents() {
  document.getElementById('saveEditBtn').addEventListener('click', saveEditBook);

  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    confirmDeleteBook();
  });

  document.getElementById('bookDetailLinkBtn').addEventListener('click', () => {
    const link = document.getElementById('bookDetailLinkBtn').dataset.link;
    if (link) {
      openLink(link);
    }
  });

  document.getElementById('bookDetailEditBtn').addEventListener('click', () => {
    const bookId = stateManager.getDetailBookId();
    if (bookId) {
      closeModal('bookDetailModal');
      editBook(bookId);
    }
  });

  document.getElementById('bookDetailDeleteBtn').addEventListener('click', () => {
    const bookId = stateManager.getDetailBookId();
    if (bookId) {
      closeModal('bookDetailModal');
      deleteBook(bookId);
    }
  });

  // 読了感想モーダル
  document.getElementById('saveCompleteNoteBtn').addEventListener('click', () => {
    saveCompleteNote();
  });

  document.getElementById('skipCompleteNoteBtn').addEventListener('click', () => {
    skipCompleteNote();
  });

  // バリデーションを初期化（入力イベントでボタン状態を更新）
  initModalValidation({
    modalId: 'editBookModal',
    buttonId: 'saveEditBtn',
    requiredFields: ['editBookTitle'],
    optionalFields: []
  });

  initModalValidation({
    modalId: 'dropBookModal',
    buttonId: 'confirmDropBtn',
    requiredFields: [],
    optionalFields: ['bookmarkInput']
  });

  initModalValidation({
    modalId: 'completeNoteModal',
    buttonId: 'saveCompleteNoteBtn',
    requiredFields: [],
    optionalFields: ['completeNoteInput']
  });

  // クリアボタンを初期化
  initClearButtons(['editBookTitle', 'editBookLink', 'bookmarkInput']);

  // ラベルセレクターのイベント初期化
  initEditLabelSelectorEvents();
}

// ========================================
// 編集モーダル ラベルセレクター
// ========================================

function renderEditLabelSelector() {
  const selectedContainer = document.getElementById('editLabelSelected');
  const allLabels = getAllLabels();

  // 選択済みラベルを表示
  if (editSelectedLabelIds.length === 0) {
    selectedContainer.innerHTML = '<span style="color: var(--text-dim); font-size: var(--font-sm);">ラベルなし</span>';
  } else {
    selectedContainer.innerHTML = editSelectedLabelIds.map(labelId => {
      const label = allLabels.find(l => l.id === labelId);
      if (!label) return '';
      return `
        <span class="label-badge label-badge--removable" data-label-id="${label.id}">
          ${escapeHtml(label.name)}
          <span class="label-badge__remove">×</span>
        </span>
      `;
    }).join('');
  }

  // ドロップダウンのオプションを更新
  renderEditLabelOptions();
}

function renderEditLabelOptions(searchTerm = '') {
  const optionsContainer = document.getElementById('editLabelOptions');
  const allLabels = getAllLabels();

  const filteredLabels = allLabels.filter(label =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  let html = filteredLabels.map(label => {
    const isSelected = editSelectedLabelIds.includes(label.id);
    return `
      <div class="label-selector__option ${isSelected ? 'label-selector__option--selected' : ''}" data-label-id="${label.id}">
        <span class="label-selector__checkbox"></span>
        <span>${escapeHtml(label.name)}</span>
      </div>
    `;
  }).join('');

  // 検索語が存在し、完全一致するラベルがない場合は新規作成オプションを表示
  if (searchTerm && !allLabels.some(l => l.name.toLowerCase() === searchTerm.toLowerCase())) {
    html += `
      <div class="label-selector__option label-selector__option--create" data-create-label="${escapeHtml(searchTerm)}">
        + 「${escapeHtml(searchTerm)}」を作成
      </div>
    `;
  }

  optionsContainer.innerHTML = html || '<div style="padding: var(--space-md); color: var(--text-dim);">ラベルがありません</div>';
}

function initEditLabelSelectorEvents() {
  const addBtn = document.getElementById('editLabelAddBtn');
  const dropdown = document.getElementById('editLabelDropdown');
  const searchInput = document.getElementById('editLabelSearchInput');
  const optionsContainer = document.getElementById('editLabelOptions');
  const selectedContainer = document.getElementById('editLabelSelected');

  if (!addBtn || !dropdown) return;

  // ドロップダウンの開閉
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('visible');
    if (dropdown.classList.contains('visible')) {
      searchInput.value = '';
      searchInput.focus();
      renderEditLabelOptions();
    }
  });

  // 検索入力
  searchInput.addEventListener('input', () => {
    renderEditLabelOptions(searchInput.value.trim());
  });

  // 検索入力でEnterキー押下時に新規作成
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const searchTerm = searchInput.value.trim();
      if (!searchTerm) return;

      const allLabels = getAllLabels();
      const existingLabel = allLabels.find(l => l.name.toLowerCase() === searchTerm.toLowerCase());

      if (existingLabel) {
        // 既存ラベルをトグル
        toggleLabelSelection(existingLabel.id);
      } else {
        // 新規作成
        createAndSelectLabel(searchTerm);
      }

      searchInput.value = '';
      renderEditLabelOptions();
    }
  });

  // オプションクリック
  optionsContainer.addEventListener('click', (e) => {
    const option = e.target.closest('.label-selector__option');
    if (!option) return;

    const createLabel = option.dataset.createLabel;
    if (createLabel) {
      createAndSelectLabel(createLabel);
      searchInput.value = '';
      renderEditLabelOptions();
    } else {
      const labelId = parseInt(option.dataset.labelId, 10);
      toggleLabelSelection(labelId);
    }
  });

  // 選択済みラベルの削除
  selectedContainer.addEventListener('click', (e) => {
    const badge = e.target.closest('.label-badge--removable');
    if (!badge) return;

    const labelId = parseInt(badge.dataset.labelId, 10);
    editSelectedLabelIds = editSelectedLabelIds.filter(id => id !== labelId);
    renderEditLabelSelector();
  });

  // ドロップダウン外クリックで閉じる
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#editLabelSelector')) {
      dropdown.classList.remove('visible');
    }
  });
}

function toggleLabelSelection(labelId) {
  if (editSelectedLabelIds.includes(labelId)) {
    editSelectedLabelIds = editSelectedLabelIds.filter(id => id !== labelId);
  } else {
    editSelectedLabelIds.push(labelId);
  }
  renderEditLabelSelector();
}

function createAndSelectLabel(name, isAddModal = false) {
  const result = addNewLabel(name);
  if (result.success && result.label) {
    if (isAddModal) {
      addSelectedLabelIds.push(result.label.id);
      renderAddLabelSelector();
    } else {
      editSelectedLabelIds.push(result.label.id);
      renderEditLabelSelector();
    }
    showToast(result.message);
  } else {
    showToast(result.message);
  }
}

// ========================================
// 追加モーダル ラベルセレクター
// ========================================

function renderAddLabelSelector() {
  const selectedContainer = document.getElementById('addLabelSelected');
  if (!selectedContainer) return;

  const allLabels = getAllLabels();

  // 選択済みラベルを表示
  if (addSelectedLabelIds.length === 0) {
    selectedContainer.innerHTML = '<span style="color: var(--text-dim); font-size: var(--font-sm);">ラベルなし</span>';
  } else {
    selectedContainer.innerHTML = addSelectedLabelIds.map(labelId => {
      const label = allLabels.find(l => l.id === labelId);
      if (!label) return '';
      return `
        <span class="label-badge label-badge--removable" data-label-id="${label.id}">
          ${escapeHtml(label.name)}
          <span class="label-badge__remove">×</span>
        </span>
      `;
    }).join('');
  }

  // ドロップダウンのオプションを更新
  renderAddLabelOptions();
}

function renderAddLabelOptions(searchTerm = '') {
  const optionsContainer = document.getElementById('addLabelOptions');
  if (!optionsContainer) return;

  const allLabels = getAllLabels();

  const filteredLabels = allLabels.filter(label =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  let html = filteredLabels.map(label => {
    const isSelected = addSelectedLabelIds.includes(label.id);
    return `
      <div class="label-selector__option ${isSelected ? 'label-selector__option--selected' : ''}" data-label-id="${label.id}">
        <span class="label-selector__checkbox"></span>
        <span>${escapeHtml(label.name)}</span>
      </div>
    `;
  }).join('');

  // 検索語が存在し、完全一致するラベルがない場合は新規作成オプションを表示
  if (searchTerm && !allLabels.some(l => l.name.toLowerCase() === searchTerm.toLowerCase())) {
    html += `
      <div class="label-selector__option label-selector__option--create" data-create-label="${escapeHtml(searchTerm)}">
        + 「${escapeHtml(searchTerm)}」を作成
      </div>
    `;
  }

  optionsContainer.innerHTML = html || '<div style="padding: var(--space-md); color: var(--text-dim);">ラベルがありません</div>';
}

function initAddLabelSelectorEvents() {
  const addBtn = document.getElementById('addLabelAddBtn');
  const dropdown = document.getElementById('addLabelDropdown');
  const searchInput = document.getElementById('addLabelSearchInput');
  const optionsContainer = document.getElementById('addLabelOptions');
  const selectedContainer = document.getElementById('addLabelSelected');

  if (!addBtn || !dropdown) return;

  // ドロップダウンの開閉
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('visible');
    if (dropdown.classList.contains('visible')) {
      searchInput.value = '';
      searchInput.focus();
      renderAddLabelOptions();
    }
  });

  // 検索入力
  searchInput.addEventListener('input', () => {
    renderAddLabelOptions(searchInput.value.trim());
  });

  // 検索入力でEnterキー押下時に新規作成
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const searchTerm = searchInput.value.trim();
      if (!searchTerm) return;

      const allLabels = getAllLabels();
      const existingLabel = allLabels.find(l => l.name.toLowerCase() === searchTerm.toLowerCase());

      if (existingLabel) {
        // 既存ラベルをトグル
        toggleAddLabelSelection(existingLabel.id);
      } else {
        // 新規作成
        createAndSelectLabel(searchTerm, true);
      }

      searchInput.value = '';
      renderAddLabelOptions();
    }
  });

  // オプションクリック
  optionsContainer.addEventListener('click', (e) => {
    const option = e.target.closest('.label-selector__option');
    if (!option) return;

    const createLabel = option.dataset.createLabel;
    if (createLabel) {
      createAndSelectLabel(createLabel, true);
      searchInput.value = '';
      renderAddLabelOptions();
    } else {
      const labelId = parseInt(option.dataset.labelId, 10);
      toggleAddLabelSelection(labelId);
    }
  });

  // 選択済みラベルの削除
  selectedContainer.addEventListener('click', (e) => {
    const badge = e.target.closest('.label-badge--removable');
    if (!badge) return;

    const labelId = parseInt(badge.dataset.labelId, 10);
    addSelectedLabelIds = addSelectedLabelIds.filter(id => id !== labelId);
    renderAddLabelSelector();
  });

  // ドロップダウン外クリックで閉じる
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#addLabelSelector')) {
      dropdown.classList.remove('visible');
    }
  });
}

function toggleAddLabelSelection(labelId) {
  if (addSelectedLabelIds.includes(labelId)) {
    addSelectedLabelIds = addSelectedLabelIds.filter(id => id !== labelId);
  } else {
    addSelectedLabelIds.push(labelId);
  }
  renderAddLabelSelector();
}

// ========================================
// カルーセル（カバン）イベント初期化
// ========================================
export function initCarouselEvents() {
  document.getElementById('bookCarousel').addEventListener('click', (e) => {
    const book = e.target.closest('.carousel-book');
    if (book && book.dataset.id) {
      selectBook(Number(book.dataset.id), true);
      updateCarouselScrollState();
    }
  });

  document.getElementById('bookCarousel').addEventListener('scroll', () => {
    updateCarouselScrollState();
    selectCenteredBook();
  });

  document.getElementById('carouselDots').addEventListener('click', (e) => {
    const dot = e.target.closest('.carousel-dot');
    if (!dot) return;

    const index = Number(dot.dataset.index);
    const carousel = document.getElementById('bookCarousel');
    const books = carousel.querySelectorAll('.carousel-book');

    if (books[index]) {
      const bookId = Number(books[index].dataset.id);
      selectBook(bookId);
      books[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      updateCarouselScrollState();
    }
  });

  document.getElementById('completeSelectedBtn').addEventListener('click', () => {
    const selectedId = stateManager.getSelectedBookId();
    if (selectedId) {
      completeBook(selectedId);
    }
  });

  document.getElementById('dropSelectedBtn').addEventListener('click', () => {
    const selectedId = stateManager.getSelectedBookId();
    if (selectedId) {
      closeBookActionsDropdown();
      openDropBookModal(selectedId);
    }
  });

  document.getElementById('confirmDropBtn').addEventListener('click', () => {
    confirmDropBook();
  });

  document.getElementById('editSelectedBtn').addEventListener('click', () => {
    const selectedId = stateManager.getSelectedBookId();
    if (selectedId) {
      closeBookActionsDropdown();
      editBook(selectedId);
    }
  });

  document.getElementById('openLinkSelectedBtn').addEventListener('click', () => {
    const selectedId = stateManager.getSelectedBookId();
    if (selectedId) {
      const book = bookRepository.getBookById(selectedId);
      if (book && book.link) {
        closeBookActionsDropdown();
        openLink(book.link);
      }
    }
  });

  // ⋮メニューの開閉
  const menuBtn = document.getElementById('bookActionsMenuBtn');
  const dropdown = document.getElementById('bookActionsDropdown');

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  // メニュー外クリックで閉じる
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.home-actions-menu')) {
      closeBookActionsDropdown();
    }
  });

}

// ドロップダウンを閉じる
function closeBookActionsDropdown() {
  const dropdown = document.getElementById('bookActionsDropdown');
  if (dropdown) {
    dropdown.classList.remove('open');
  }
}

// ========================================
// 書斎イベント初期化
// ========================================
export function initStudyEvents() {
  document.getElementById('studyStatusTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.status-tab');
    if (!tab) return;

    const status = tab.dataset.status;
    if (!status) return;

    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    stateManager.clearStudySelection();
    stateManager.setCurrentStudyStatus(status);
    renderStudyBooks();
  });

  // ラベルフィルター検索のイベント
  const labelFilterInput = document.getElementById('labelFilterSearchInput');
  const labelFilterDropdown = document.getElementById('labelFilterDropdown');
  const labelFilterDropdownSearch = document.getElementById('labelFilterDropdownSearch');
  const labelFilterOptions = document.getElementById('labelFilterOptions');
  const labelFilterClearBtn = document.getElementById('labelFilterClearBtn');
  const labelManagerBtn = document.getElementById('openLabelManagerBtn');

  // 管理ボタン
  if (labelManagerBtn) {
    labelManagerBtn.addEventListener('click', () => {
      openLabelManager();
    });
  }

  // クリアボタン
  if (labelFilterClearBtn) {
    labelFilterClearBtn.addEventListener('click', () => {
      stateManager.setSelectedLabelId(null);
      stateManager.clearStudySelection();
      renderStudyBooks();
    });
  }

  // 入力欄クリックでドロップダウンを開く
  if (labelFilterInput && labelFilterDropdown) {
    labelFilterInput.addEventListener('click', () => {
      if (labelFilterDropdownSearch) {
        labelFilterDropdownSearch.value = '';
      }
      renderLabelFilterOptions();
      labelFilterDropdown.classList.add('visible');
    });

    // ドロップダウン検索
    if (labelFilterDropdownSearch) {
      labelFilterDropdownSearch.addEventListener('input', (e) => {
        renderLabelFilterOptions(e.target.value.trim());
      });
    }

    // ラベル選択
    if (labelFilterOptions) {
      labelFilterOptions.addEventListener('click', (e) => {
        const option = e.target.closest('.label-filter-search__option');
        if (!option) return;

        const labelId = parseInt(option.dataset.labelId, 10);
        stateManager.setSelectedLabelId(labelId);
        stateManager.clearStudySelection();
        labelFilterDropdown.classList.remove('visible');
        renderStudyBooks();
      });
    }

    // ドロップダウン外クリックで閉じる
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.label-filter-search')) {
        labelFilterDropdown.classList.remove('visible');
      }
    });
  }

  initShelfEvents({
    shelfId: 'studyShelf',
    bookListId: 'studyBookList',
    miniBookClass: 'mini-book',
    handlers: studyBookListHandlers,
    fallback: studyBookListFallback,
    getSelectedId: () => stateManager.getStudySelectedBookId(),
    setSelectedId: (id) => stateManager.setStudySelectedBookId(id),
    clearSelection: () => stateManager.clearStudySelection(),
    renderFn: renderStudyBooks
  });
}

// ========================================
// 本屋イベント初期化
// ========================================
export function initStoreEvents() {
  initShelfEvents({
    shelfId: 'storeShelf',
    bookListId: 'storeBookList',
    miniBookClass: 'mini-book',
    handlers: storeBookListHandlers,
    fallback: storeBookListFallback,
    getSelectedId: () => stateManager.getStoreSelectedBookId(),
    setSelectedId: (id) => stateManager.setStoreSelectedBookId(id),
    clearSelection: () => stateManager.clearStoreSelection(),
    renderFn: renderStoreBooks
  });
}

// ========================================
// 再会モーダル
// ========================================
let reunionBookId = null;

// セクションの条件付き表示ヘルパー
function showSection(sectionId, contentId, content, renderFn = null) {
  const section = document.getElementById(sectionId);
  const contentEl = document.getElementById(contentId);

  if (content) {
    if (renderFn) {
      contentEl.innerHTML = renderFn(content);
    } else {
      contentEl.textContent = content;
    }
    section.style.display = 'block';
  } else {
    section.style.display = 'none';
  }
}

export function openReunionModal(id) {
  const book = bookRepository.getBookById(id);
  if (!book) return;

  reunionBookId = id;

  // タイトル
  document.getElementById('reunionBookTitle').textContent = book.title;

  // きっかけ
  showSection('reunionTriggerSection', 'reunionTriggerNote', book.triggerNote);

  // 読了時の感想
  showSection('reunionCompletionSection', 'reunionCompletionNote', book.completionNote);

  // 過去の振り返り
  showSection(
    'reunionReflectionsSection',
    'reunionReflectionsList',
    book.reflections?.length > 0 ? book.reflections : null,
    (reflections) => reflections.map(r => `
      <div class="reflection-item">
        <span class="reflection-date">${escapeHtml(r.date)}</span>
        <p class="reflection-note">${escapeHtml(r.note)}</p>
      </div>
    `).join('')
  );

  // 入力欄クリア
  document.getElementById('reunionInput').value = '';

  openModal('reunionModal');

  // バリデーション状態を更新
  updateButtonState('saveReunionBtn', [], ['reunionInput']);
}

export function saveReunion() {
  if (!reunionBookId) return;

  const note = document.getElementById('reunionInput').value.trim();
  if (!note) {
    closeModal('reunionModal');
    return;
  }

  const result = bookService.addReflection(reunionBookId, note);

  closeModal('reunionModal');
  showToast(result.message);
  renderBooks();
}

export function skipReunion() {
  closeModal('reunionModal');
}

export function initReunionEvents() {
  document.getElementById('saveReunionBtn').addEventListener('click', saveReunion);
  document.getElementById('skipReunionBtn').addEventListener('click', skipReunion);

  initModalValidation({
    modalId: 'reunionModal',
    buttonId: 'saveReunionBtn',
    requiredFields: [],
    optionalFields: ['reunionInput']
  });
}
