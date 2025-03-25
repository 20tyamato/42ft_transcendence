// frontend/src/utils/date.ts
import { logger } from '@/core/Logger';
/**
 * ISO形式の日時文字列を読みやすい形式に変換
 * @param isoString ISO形式の日時文字列
 * @returns フォーマットされた日時文字列
 */
export function formatDate(isoString: string): string {
  if (!isoString) return 'N/A';

  try {
    const date = new Date(isoString);

    // 日時が無効な場合
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // 日時フォーマット
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    logger.error('Error formatting date:', error);
    return 'Error';
  }
}
