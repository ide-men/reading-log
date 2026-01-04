import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addLabel,
  updateLabel,
  deleteLabel,
  getLabelUsageCount,
  getAllLabels,
  getLabelById,
  addLabelToBook,
  removeLabelFromBook,
  setBookLabels,
  getBookLabels
} from '../../js/domain/label/label-service.js';
import { stateManager } from '../../js/core/state-manager.js';
import { resetIdCounter } from '../../js/domain/label/label-entity.js';

describe('label-service', () => {
  beforeEach(() => {
    // 状態をリセット
    stateManager.initialize({
      meta: { schemaVersion: 1, createdAt: new Date().toISOString() },
      stats: { total: 0, today: 0, date: new Date().toDateString(), sessions: 0, firstSessionDate: null },
      books: [
        { id: 1, title: '本1', labelIds: [] },
        { id: 2, title: '本2', labelIds: [] },
        { id: 3, title: '本3', labelIds: [] }
      ],
      history: [],
      archived: {},
      labels: []
    });
    resetIdCounter();
  });

  describe('addLabel', () => {
    it('新しいラベルを追加できる', () => {
      const result = addLabel('ビジネス書');
      expect(result.success).toBe(true);
      expect(result.message).toBe('ラベルを追加しました');
      expect(result.label).toBeDefined();
      expect(result.label.name).toBe('ビジネス書');

      const labels = getAllLabels();
      expect(labels).toHaveLength(1);
      expect(labels[0].name).toBe('ビジネス書');
    });

    it('空のラベル名はエラー', () => {
      const result = addLabel('');
      expect(result.success).toBe(false);
      expect(result.message).toBe('ラベル名を入力してください');
    });

    it('重複するラベル名はエラー', () => {
      addLabel('ビジネス書');
      const result = addLabel('ビジネス書');
      expect(result.success).toBe(false);
      expect(result.message).toBe('同じ名前のラベルが既に存在します');
    });
  });

  describe('updateLabel', () => {
    it('ラベル名を更新できる', () => {
      const addResult = addLabel('古いラベル');
      const labelId = addResult.label.id;

      const result = updateLabel(labelId, '新しいラベル');
      expect(result.success).toBe(true);
      expect(result.message).toBe('ラベルを更新しました');

      const label = getLabelById(labelId);
      expect(label.name).toBe('新しいラベル');
    });

    it('存在しないラベルはエラー', () => {
      const result = updateLabel(99999, '新しいラベル');
      expect(result.success).toBe(false);
      expect(result.message).toBe('ラベルが見つかりません');
    });

    it('他のラベルと重複する名前はエラー', () => {
      addLabel('ラベル1');
      const addResult2 = addLabel('ラベル2');

      const result = updateLabel(addResult2.label.id, 'ラベル1');
      expect(result.success).toBe(false);
      expect(result.message).toBe('同じ名前のラベルが既に存在します');
    });
  });

  describe('deleteLabel', () => {
    it('ラベルを削除できる', () => {
      const addResult = addLabel('削除するラベル');
      const labelId = addResult.label.id;

      const result = deleteLabel(labelId);
      expect(result.success).toBe(true);
      expect(result.message).toBe('ラベルを削除しました');

      const labels = getAllLabels();
      expect(labels).toHaveLength(0);
    });

    it('存在しないラベルはエラー', () => {
      const result = deleteLabel(99999);
      expect(result.success).toBe(false);
      expect(result.message).toBe('ラベルが見つかりません');
    });

    it('ラベル削除時に本からもラベルが外れる', () => {
      const addResult = addLabel('テストラベル');
      const labelId = addResult.label.id;

      addLabelToBook(1, labelId);
      addLabelToBook(2, labelId);

      deleteLabel(labelId);

      const book1Labels = getBookLabels(1);
      const book2Labels = getBookLabels(2);
      expect(book1Labels).toHaveLength(0);
      expect(book2Labels).toHaveLength(0);
    });
  });

  describe('getLabelUsageCount', () => {
    it('ラベルを使用している本の数を取得できる', () => {
      const addResult = addLabel('テストラベル');
      const labelId = addResult.label.id;

      expect(getLabelUsageCount(labelId)).toBe(0);

      addLabelToBook(1, labelId);
      expect(getLabelUsageCount(labelId)).toBe(1);

      addLabelToBook(2, labelId);
      expect(getLabelUsageCount(labelId)).toBe(2);
    });
  });

  describe('addLabelToBook', () => {
    it('本にラベルを追加できる', () => {
      const addResult = addLabel('テストラベル');
      const labelId = addResult.label.id;

      const result = addLabelToBook(1, labelId);
      expect(result.success).toBe(true);

      const labels = getBookLabels(1);
      expect(labels).toHaveLength(1);
      expect(labels[0].name).toBe('テストラベル');
    });

    it('存在しない本はエラー', () => {
      const addResult = addLabel('テストラベル');
      const result = addLabelToBook(99999, addResult.label.id);
      expect(result.success).toBe(false);
      expect(result.message).toBe('本が見つかりません');
    });

    it('存在しないラベルはエラー', () => {
      const result = addLabelToBook(1, 99999);
      expect(result.success).toBe(false);
      expect(result.message).toBe('ラベルが見つかりません');
    });

    it('重複してラベルを追加できない', () => {
      const addResult = addLabel('テストラベル');
      const labelId = addResult.label.id;

      addLabelToBook(1, labelId);
      const result = addLabelToBook(1, labelId);
      expect(result.success).toBe(false);
      expect(result.message).toBe('既にこのラベルが付いています');
    });
  });

  describe('removeLabelFromBook', () => {
    it('本からラベルを削除できる', () => {
      const addResult = addLabel('テストラベル');
      const labelId = addResult.label.id;

      addLabelToBook(1, labelId);
      const result = removeLabelFromBook(1, labelId);
      expect(result.success).toBe(true);

      const labels = getBookLabels(1);
      expect(labels).toHaveLength(0);
    });

    it('付いていないラベルは削除できない', () => {
      const addResult = addLabel('テストラベル');
      const result = removeLabelFromBook(1, addResult.label.id);
      expect(result.success).toBe(false);
      expect(result.message).toBe('このラベルは付いていません');
    });
  });

  describe('setBookLabels', () => {
    it('本のラベルを一括設定できる', () => {
      const label1 = addLabel('ラベル1').label;
      const label2 = addLabel('ラベル2').label;

      const result = setBookLabels(1, [label1.id, label2.id]);
      expect(result.success).toBe(true);

      const labels = getBookLabels(1);
      expect(labels).toHaveLength(2);
    });

    it('空の配列でラベルをクリアできる', () => {
      const label1 = addLabel('ラベル1').label;
      addLabelToBook(1, label1.id);

      setBookLabels(1, []);
      const labels = getBookLabels(1);
      expect(labels).toHaveLength(0);
    });
  });

  describe('getBookLabels', () => {
    it('本のラベル情報を取得できる', () => {
      const label1 = addLabel('ラベル1').label;
      const label2 = addLabel('ラベル2').label;

      addLabelToBook(1, label1.id);
      addLabelToBook(1, label2.id);

      const labels = getBookLabels(1);
      expect(labels).toHaveLength(2);
      expect(labels.map(l => l.name)).toContain('ラベル1');
      expect(labels.map(l => l.name)).toContain('ラベル2');
    });

    it('存在しない本は空の配列を返す', () => {
      const labels = getBookLabels(99999);
      expect(labels).toHaveLength(0);
    });
  });
});
