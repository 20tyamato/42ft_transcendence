import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { checkUserAccess } from '@/models/User/auth';

interface Friend {
  id: number;
  username: string;
  is_online: boolean;
}

const friendsContainer = document.getElementById("friends-container") as HTMLUListElement;
const usernameInput = document.getElementById("username-input") as HTMLInputElement;
const addFriendBtn = document.getElementById("add-friend-btn") as HTMLButtonElement;

async function loadFriends(): Promise<void> {
  try {
    const response = await fetch("/api/friends", {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
      throw new Error("フレンドの取得に失敗しました");
    }
    const friends: Friend[] = await response.json();
    renderFriends(friends);
  } catch (error) {
    console.error("Error loading friends:", error);
  }
}
function renderFriends(friends: Friend[]): void {
  friendsContainer.innerHTML = "";
  friends.forEach((friend) => {
    const li = document.createElement("li");
    li.className = "friend-item";

    // フレンド情報エリア
    const friendInfo = document.createElement("div");
    friendInfo.className = "friend-info";

    // オンライン状態インジケータ
    const statusIndicator = document.createElement("span");
    statusIndicator.className = "status-indicator";
    statusIndicator.style.backgroundColor = friend.is_online ? "green" : "gray";
    statusIndicator.title = friend.is_online ? "オンライン" : "オフライン";

    // ユーザー名表示
    const usernameSpan = document.createElement("span");
    usernameSpan.textContent = friend.username;
    usernameSpan.className = "friend-username";

    friendInfo.appendChild(statusIndicator);
    friendInfo.appendChild(usernameSpan);
    li.appendChild(friendInfo);

    // 削除ボタン
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "削除";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", () => {
      deleteFriend(friend.id);
    });
    li.appendChild(deleteBtn);

    friendsContainer.appendChild(li);
  });
}

async function addFriend(username: string): Promise<void> {
  try {
    const response = await fetch("/api/friends/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    if (!response.ok) {
      throw new Error("フレンドの追加に失敗しました");
    }
    await loadFriends();
    usernameInput.value = "";
  } catch (error) {
    console.error("Error adding friend:", error);
  }
}

async function deleteFriend(friendId: number): Promise<void> {
  try {
    const response = await fetch(`/api/friends/${friendId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
      throw new Error("フレンドの削除に失敗しました");
    }
    await loadFriends();
  } catch (error) {
    console.error("Error deleting friend:", error);
  }
}

const FriendsPage = new Page({
  name: 'Friends',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    checkUserAccess();

    // フレンド追加ボタンのクリックイベント
    addFriendBtn.addEventListener("click", () => {
      const username = usernameInput.value.trim();
      if (username) {
        addFriend(username);
      }
    });
    
    // ページロード時にフレンド一覧を読み込み
    loadFriends();
  },
});

export default FriendsPage;
