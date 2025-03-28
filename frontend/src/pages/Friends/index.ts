import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { IFriend } from '@/models/interface';

import { logger } from '@/core/Logger';
import { fetcher } from '@/utils/fetcher';
import { setUserLanguage } from '@/utils/language';
import { updatePlaceholder, updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  updateText('title', i18next.t('myFriends'));
  updateText('.container h1', i18next.t('myFriends'));
  updatePlaceholder('#username-input', i18next.t('enterUsername'));
  updateText('#add-friend-btn', i18next.t('addFriend'));
  updateText('.friend-list h2', i18next.t('friendList'));
};

async function loadFriends(): Promise<void> {
  try {
    const { data } = await fetcher<IFriend[]>('/api/users/me/friends/', {
      method: 'GET',
    });
    renderFriends(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error loading friends:', error.message);
    } else {
      logger.error('Unknown error loading friends');
    }
  }
}

async function addFriend(username: string): Promise<void> {
  try {
    await fetcher<IFriend>('/api/users/me/friends/add/', {
      method: 'POST',
      body: { username },
    });

    await loadFriends();
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error adding friend:', error.message);
    } else {
      logger.error('Unknown error adding friend');
    }
  }
}

async function deleteFriend(friendId: number): Promise<void> {
  try {
    await fetcher(`/api/users/me/friends/${friendId}/`, {
      method: 'DELETE',
    });
    await loadFriends();
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error deleting friend:', error.message);
    } else {
      logger.error('Unknown error deleting friend');
    }
  }
}

function renderFriends(friends: IFriend[]): void {
  const friendsContainer = document.getElementById('friends-container') as HTMLUListElement | null;
  if (!friendsContainer) {
    logger.error("Element with ID 'friends-container' not found in the DOM.");
    return;
  }

  if (friends.length === 0) {
    friendsContainer.innerHTML = `<li>${i18next.t('noFriends')}</li>`;
    return;
  }

  friendsContainer.innerHTML = '';
  friends.forEach((friend) => {
    const li = document.createElement('li');
    li.className = 'friend-item';

    // フレンド情報エリア
    const friendInfo = document.createElement('div');
    friendInfo.className = 'friend-info';

    // オンライン状態インジケータ
    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'status-indicator';
    statusIndicator.style.backgroundColor = friend.is_online ? 'green' : 'red';
    statusIndicator.title = friend.is_online ? i18next.t('online') : i18next.t('offline');

    // ユーザー名表示
    const usernameSpan = document.createElement('span');
    usernameSpan.textContent = friend.username;
    usernameSpan.className = 'friend-username';

    friendInfo.appendChild(statusIndicator);
    friendInfo.appendChild(usernameSpan);
    li.appendChild(friendInfo);

    // 削除ボタン
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = i18next.t('delete');
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', () => {
      deleteFriend(friend.id);
    });
    li.appendChild(deleteBtn);

    friendsContainer.appendChild(li);
  });
}

const FriendsPage = new Page({
  name: 'Friends',
  config: {
    layout: AuthLayout,
  },
  mounted: async ({ pg, user }): Promise<void> => {
    // 言語設定とページ内文言の更新
    setUserLanguage(user.language, updatePageContent);
    loadFriends();

    // イベント登録：Enter キーでフレンド追加
    const usernameInput = document.getElementById('username-input') as HTMLInputElement | null;
    usernameInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const username = usernameInput.value.trim();
        if (username) {
          addFriend(username);
          usernameInput.value = '';
        }
      }
    });

    // イベント登録：ボタン押下でフレンド追加
    const addFriendBtn = document.getElementById('add-friend-btn') as HTMLButtonElement | null;
    addFriendBtn?.addEventListener('click', () => {
      const username = usernameInput?.value.trim();
      if (username) {
        addFriend(username);
      }
    });

    pg.logger.info('FriendsPage mounted!');
  },
});

export default FriendsPage;
