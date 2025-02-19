import { API_URL } from '@/config/config';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { checkUserAccess } from '@/models/User/auth';
import { fetchCurrentUser } from '@/models/User/repository';
import { setUserLanguage } from '@/utils/language';
import i18next from 'i18next';

interface Friend {
  id: number;
  username: string;
  is_online: boolean;
}

const token = localStorage.getItem('token');

const updatePageContent = () => {
  document.title = i18next.t('myFriends');

  const header = document.querySelector('.container h1');
  if (header) header.textContent = i18next.t('myFriends');

  const usernameInput = document.getElementById('username-input') as HTMLInputElement;
  if (usernameInput) usernameInput.placeholder = i18next.t('enterUsername');

  const addFriendButton = document.getElementById('add-friend-btn');
  if (addFriendButton) addFriendButton.textContent = i18next.t('addFriend');

  const friendListHeader = document.querySelector('.friend-list h2');
  if (friendListHeader) friendListHeader.textContent = i18next.t('friendList');
};

async function loadFriends(): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/users/me/friends/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Failed to load friends: ${errorMsg}`);
    }
    const friends: Friend[] = await response.json();
    renderFriends(friends);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error loading friends:', error.message);
    } else {
      console.error('Unknown error loading friends');
    }
  }
}

function renderFriends(friends: Friend[]): void {
  const friendsContainer = document.getElementById('friends-container') as HTMLUListElement;
  if (!friendsContainer) {
    console.error("Element with ID 'friends-container' not found in the DOM.");
    return;
  }

  if (!friends.length) {
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

async function addFriend(username: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/users/me/friends/add/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Failed to add friend: ${errorMsg}`);
    }
    await loadFriends();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error adding friend:', error.message);
    } else {
      console.error('Unknown error adding friend');
    }
  }
}

async function deleteFriend(friendId: number): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/users/me/friends/${friendId}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Failed to delete friend: ${errorMsg}`);
    }
    await loadFriends();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error deleting friend:', error.message);
    } else {
      console.error('Unknown error deleting friend');
    }
  }
}

const FriendsPage = new Page({
  name: 'Friends',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }) => {
    checkUserAccess();
    const userData = await fetchCurrentUser();
    
    setUserLanguage(userData.language, updatePageContent);
    loadFriends();

    const usernameInput = document.getElementById('username-input') as HTMLInputElement;
    usernameInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const username = usernameInput.value.trim();
        if (username) {
          addFriend(username);
          usernameInput.value = '';
        }
      }
    });

    const addFriendBtn = document.getElementById('add-friend-btn') as HTMLButtonElement;
    addFriendBtn?.addEventListener('click', () => {
      const username = usernameInput.value.trim();
      if (username) {
        addFriend(username);
      }
    });
    pg.logger.info('FriendsPage mounted!');
  },
});

export default FriendsPage;
