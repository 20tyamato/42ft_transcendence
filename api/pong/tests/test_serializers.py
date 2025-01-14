from pong.models import User
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase
from pong.serializers import UserSerializer

class UserSerializerTests(APITestCase):
    def setUp(self):
        """テストの初期設定"""
        self.valid_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'display_name': 'Test User',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!'
        }

    # Username Tests
    def test_username_too_long(self):
        data = self.valid_data.copy()
        data['username'] = 'a' * 151  # Djangoのデフォルト上限は150文字
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_username_empty(self):
        data = self.valid_data.copy()
        data['username'] = ''
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_username_special_chars(self):
        data = self.valid_data.copy()
        data['username'] = 'test@user!'  # 特殊文字を含む
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    # Email Tests
    def test_email_invalid_format(self):
        data = self.valid_data.copy()
        data['email'] = 'invalid-email'
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_email_too_long(self):
        data = self.valid_data.copy()
        data['email'] = 'a' * 245 + '@example.com'  # 254文字（標準的な上限は254文字）
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    # Display Name Tests
    def test_display_name_too_long(self):
        data = self.valid_data.copy()
        data['display_name'] = 'a' * 51  # モデルで定義した50文字制限
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('display_name', serializer.errors)

    def test_display_name_empty(self):
        data = self.valid_data.copy()
        data['display_name'] = ''
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('display_name', serializer.errors)

    # Password Tests
    def test_password_too_short(self):
        data = self.valid_data.copy()
        data.update({'password': 'short', 'password2': 'short'})
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_no_numbers(self):
        data = self.valid_data.copy()
        data.update({'password': 'NoNumbersHere!', 'password2': 'NoNumbersHere!'})
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_no_special_chars(self):
        data = self.valid_data.copy()
        data.update({'password': 'NoSpecialChars123', 'password2': 'NoSpecialChars123'})
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    # Missing Fields Tests
    def test_missing_username(self):
        data = self.valid_data.copy()
        del data['username']
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_missing_email(self):
        data = self.valid_data.copy()
        del data['email']
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_missing_display_name(self):
        data = self.valid_data.copy()
        del data['display_name']
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('display_name', serializer.errors)

    # Additional Edge Cases
    def test_whitespace_only_fields(self):
        data = self.valid_data.copy()
        data['username'] = '   '
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_case_sensitivity_username(self):
        # First create a user
        user_data = self.valid_data.copy()
        user_data.pop('password2')
        User.objects.create_user(**user_data)
        
        # Try to create another user with same username but different case
        data = self.valid_data.copy()
        data['username'] = data['username'].upper()
        data['display_name'] = 'Different Display Name'  # display_nameを変更
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_unicode_characters(self):
        data = self.valid_data.copy()
        data['display_name'] = '테스트사용자'  # Korean characters
        serializer = UserSerializer(data=data)
        self.assertTrue(serializer.is_valid())  # Should allow Unicode characters

    def test_sql_injection_attempt(self):
        data = self.valid_data.copy()
        data['username'] = "robert'); DROP TABLE users;--"
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)