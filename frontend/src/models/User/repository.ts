import { API_URL } from '@/config/config';

const token = localStorage.getItem('token');

const fetchCurrentUser = async () => {
  const response = await fetch(`${API_URL}/api/users/me/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  return response.json();
};

export { fetchCurrentUser };
