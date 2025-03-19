from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from django.test import override_settings

from pong.models import Game, User


@override_settings(
    SECURE_SSL_REDIRECT=False, SESSION_COOKIE_SECURE=False, CSRF_COOKIE_SECURE=False
)
class UserViewsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse("pong:user-list-create")
        self.valid_data = {
            "username": "testuser",
            "email": "test@example.com",
            "display_name": "Test User",
            "password": "SecurePass123!",
            "password2": "SecurePass123!",
        }

    # 基本的な操作のテスト
    def test_create_user_success(self):
        """正常なユーザー登録のテスト"""
        response = self.client.post(self.register_url, self.valid_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, "testuser")
        self.assertIn("message", response.data)
        self.assertEqual(response.data["message"], "User created successfully")
        self.assertIn("user", response.data)

    def test_get_users_list(self):
        """ユーザー一覧取得のテスト"""
        # まずユーザーを作成
        self.client.post(self.register_url, self.valid_data, format="json")

        # 一覧を取得
        response = self.client.get(self.register_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["username"], "testuser")

    # データ検証のテスト
    def test_create_user_missing_fields(self):
        """必須フィールドが欠落している場合のテスト"""
        # 実際に必須と定義されているフィールド
        required_fields = ["username", "password", "email"]

        for field in required_fields:
            invalid_data = self.valid_data.copy()
            invalid_data.pop(field)
            response = self.client.post(self.register_url, invalid_data, format="json")
            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Field '{field}' should be required",
            )
            self.assertIn(field, response.data)

    def test_create_user_with_empty_fields(self):
        """空の値を持つフィールドでの登録テスト"""
        fields = ["username", "email", "display_name"]

        for field in fields:
            invalid_data = self.valid_data.copy()
            invalid_data[field] = ""
            response = self.client.post(self.register_url, invalid_data, format="json")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn(field, response.data)

    # 重複データのテスト
    def test_create_duplicate_user(self):
        """重複するユーザーデータでの登録テスト"""
        # 最初のユーザーを作成
        self.client.post(self.register_url, self.valid_data, format="json")

        # 同じデータで2回目の登録を試みる
        response = self.client.post(self.register_url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # 特殊なデータのテスト
    def test_create_user_with_whitespace(self):
        """空白文字を含むデータでの登録テスト"""
        whitespace_data = self.valid_data.copy()
        whitespace_data["username"] = "   testuser   "
        whitespace_data["display_name"] = "   Test User   "

        response = self.client.post(self.register_url, whitespace_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 空白が適切に処理されているか確認
        self.assertNotEqual(response.data["user"]["username"], "   testuser   ")

    def test_create_user_with_special_characters(self):
        """特殊文字を含むデータでの登録テスト"""
        special_chars_data = self.valid_data.copy()
        special_chars_data["display_name"] = "Test@User#123"

        response = self.client.post(
            self.register_url, special_chars_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_user_with_long_values(self):
        """最大長に近い値でのテスト"""
        long_data = self.valid_data.copy()
        long_data["username"] = "a" * 150  # Djangoのデフォルト最大長
        long_data["display_name"] = "b" * 50  # モデルで定義した最大長

        response = self.client.post(self.register_url, long_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # HTTPメソッドのテスト
    def test_unsupported_methods(self):
        """サポートされていないHTTPメソッドのテスト"""
        methods = ["put", "patch", "delete"]
        for method in methods:
            response = getattr(self.client, method)(self.register_url)
            self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # レスポンスの形式のテスト
    def test_response_structure(self):
        """レスポンスの構造が正しいことを確認するテスト"""
        response = self.client.post(self.register_url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 必要なフィールドが含まれているか確認
        self.assertIn("user", response.data)
        self.assertIn("message", response.data)

        # ユーザーオブジェクトに必要なフィールドが含まれているか確認
        user_data = response.data["user"]
        expected_fields = ["id", "username", "email", "display_name"]
        for field in expected_fields:
            self.assertIn(field, user_data)

    def test_list_pagination(self):
        """ページネーションのテスト（多数のユーザーが存在する場合）"""
        # 複数のユーザーを作成
        for i in range(10):
            data = self.valid_data.copy()
            data["username"] = f"testuser{i}"
            data["email"] = f"test{i}@example.com"
            data["display_name"] = f"Test User {i}"
            self.client.post(self.register_url, data, format="json")

        response = self.client.get(self.register_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # ページネーションが正しく機能しているか確認
        if "results" in response.data:  # ページネーションが有効な場合
            self.assertIn("count", response.data)
            self.assertIn("next", response.data)
            self.assertIn("previous", response.data)


@override_settings(
    SECURE_SSL_REDIRECT=False, SESSION_COOKIE_SECURE=False, CSRF_COOKIE_SECURE=False
)
class LoginViewTest(APITestCase):
    def setUp(self):
        """テストの初期設定"""
        self.login_url = reverse("pong:login")
        # create_userを2段階に分ける
        self.user = get_user_model().objects.create_user(
            username="testuser", password="testpass123", email="test@example.com"
        )
        # display_nameを後から設定
        self.user.display_name = "Test User"
        self.user.save()

        self.login_data = {"username": "testuser", "password": "testpass123"}

    def test_login_success(self):
        """正常なログインのテスト"""
        response = self.client.post(self.login_url, self.login_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertIn("user_id", response.data)
        self.assertIn("username", response.data)
        self.assertEqual(response.data["username"], "testuser")

    def test_login_with_wrong_password(self):
        """誤ったパスワードでのログイン試行テスト"""
        wrong_data = {"username": "testuser", "password": "wrongpass"}
        response = self.client.post(self.login_url, wrong_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_non_existent_user(self):
        """存在しないユーザーでのログイン試行テスト"""
        non_existent_data = {"username": "nonexistentuser", "password": "testpass123"}
        response = self.client.post(self.login_url, non_existent_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_missing_fields(self):
        """必須フィールドが欠落しているケースのテスト"""
        missing_username = {"password": "testpass123"}
        missing_password = {"username": "testuser"}

        response1 = self.client.post(self.login_url, missing_username, format="json")
        response2 = self.client.post(self.login_url, missing_password, format="json")

        self.assertEqual(response1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_empty_fields(self):
        """空のフィールドでのログイン試行テスト"""
        empty_fields_data = {"username": "", "password": ""}
        response = self.client.post(self.login_url, empty_fields_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_method_not_allowed(self):
        """GETメソッドが許可されていないことのテスト"""
        response = self.client.get(self.login_url)

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


@override_settings(
    SECURE_SSL_REDIRECT=False, SESSION_COOKIE_SECURE=False, CSRF_COOKIE_SECURE=False
)
class GameViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass", display_name="Test User"
        )
        self.client.force_authenticate(user=self.user)

    def test_create_ai_game(self):
        """Test creating a game against AI"""
        url = reverse("pong:game-list-create")

        # リクエストデータを更新 - 現在のAPIスキーマに合わせる
        data = {
            "player1": self.user.username,
            "game_type": "SINGLE",  # SINGLEタイプの明示
            "status": "IN_PROGRESS",
            "ai_level": 1,  # AIレベルを追加
            "score_player1": 0,
            "score_player2": 0,
        }

        # デバッグ用出力
        # print(f"AIゲーム作成テスト - リクエストデータ: {data}")

        response = self.client.post(url, data, format="json")

        # デバッグ用出力
        if response.status_code != status.HTTP_201_CREATED:
            print(f"エラーレスポンス内容: {response.data}")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Game.objects.count(), 1)

        # 作成されたゲームの属性を検証
        game = Game.objects.first()
        self.assertEqual(game.player1, self.user)
        self.assertIsNone(game.player2)
        self.assertEqual(game.game_type, "SINGLE")
        self.assertEqual(game.ai_level, 1)
