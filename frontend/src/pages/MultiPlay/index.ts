import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const MultiPlayPage = new Page({
  name: 'MultiPlay',
  config: { layout: CommonLayout },
  mounted: () => {
    // ボタン要素が存在する場合のみイベントを登録
    document.getElementById('start-matchmaking')?.addEventListener('click', () => {
      window.location.href = '/multiplay/waiting';
    });
  },
});

export default MultiPlayPage;
