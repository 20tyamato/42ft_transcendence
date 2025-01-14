from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from pong.models import User

class UserViewsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('pong:user-list-create')
        self.valid_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'display_name': 'Test User',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!'
        }

    # 基本的な操作のテスト
    def test_create_user_success(self):
        """正常なユーザー登録のテスト"""
        response = self.client.post(self.register_url, self.valid_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, 'testuser')
        self.assertIn('message', response.data)
        self.assertEqual(response.data['message'], 'User created successfully')
        self.assertIn('user', response.data)

    def test_get_users_list(self):
        """ユーザー一覧取得のテスト"""
        # まずユーザーを作成
        self.client.post(self.register_url, self.valid_data, format='json')

        # 一覧を取得
        response = self.client.get(self.register_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'testuser')

    # データ検証のテスト
    def test_create_user_missing_fields(self):
        """必須フィールドが欠落している場合のテスト"""
        required_fields = ['username', 'email', 'display_name', 'password', 'password2']

        for field in required_fields:
            invalid_data = self.valid_data.copy()
            invalid_data.pop(field)
            response = self.client.post(self.register_url, invalid_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn(field, response.data)

    def test_create_user_with_empty_fields(self):
        """空の値を持つフィールドでの登録テスト"""
        fields = ['username', 'email', 'display_name']

        for field in fields:
            invalid_data = self.valid_data.copy()
            invalid_data[field] = ''
            response = self.client.post(self.register_url, invalid_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn(field, response.data)

    # 重複データのテスト
    def test_create_duplicate_user(self):
        """重複するユーザーデータでの登録テスト"""
        # 最初のユーザーを作成
        self.client.post(self.register_url, self.valid_data, format='json')

        # 同じデータで2回目の登録を試みる
        response = self.client.post(self.register_url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # 特殊なデータのテスト
    def test_create_user_with_whitespace(self):
        """空白文字を含むデータでの登録テスト"""
        whitespace_data = self.valid_data.copy()
        whitespace_data['username'] = '   testuser   '
        whitespace_data['display_name'] = '   Test User   '

        response = self.client.post(self.register_url, whitespace_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 空白が適切に処理されているか確認
        self.assertNotEqual(response.data['user']['username'], '   testuser   ')

    def test_create_user_with_special_characters(self):
        """特殊文字を含むデータでの登録テスト"""
        special_chars_data = self.valid_data.copy()
        special_chars_data['display_name'] = 'Test@User#123'

        response = self.client.post(self.register_url, special_chars_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_user_with_long_values(self):
        """最大長に近い値でのテスト"""
        long_data = self.valid_data.copy()
        long_data['username'] = 'a' * 150  # Djangoのデフォルト最大長
        long_data['display_name'] = 'b' * 50  # モデルで定義した最大長

        response = self.client.post(self.register_url, long_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # HTTPメソッドのテスト
    def test_unsupported_methods(self):
        """サポートされていないHTTPメソッドのテスト"""
        methods = ['put', 'patch', 'delete']
        for method in methods:
            response = getattr(self.client, method)(self.register_url)
            self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # レスポンスの形式のテスト
    def test_response_structure(self):
        """レスポンスの構造が正しいことを確認するテスト"""
        response = self.client.post(self.register_url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 必要なフィールドが含まれているか確認
        self.assertIn('user', response.data)
        self.assertIn('message', response.data)

        # ユーザーオブジェクトに必要なフィールドが含まれているか確認
        user_data = response.data['user']
        expected_fields = ['id', 'username', 'email', 'display_name']
        for field in expected_fields:
            self.assertIn(field, user_data)

    def test_list_pagination(self):
        """ページネーションのテスト（多数のユーザーが存在する場合）"""
        # 複数のユーザーを作成
        for i in range(10):
            data = self.valid_data.copy()
            data['username'] = f'testuser{i}'
            data['email'] = f'test{i}@example.com'
            data['display_name'] = f'Test User {i}'
            self.client.post(self.register_url, data, format='json')

        response = self.client.get(self.register_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # ページネーションが正しく機能しているか確認
        if 'results' in response.data:  # ページネーションが有効な場合
            self.assertIn('count', response.data)
            self.assertIn('next', response.data)
            self.assertIn('previous', response.data)
