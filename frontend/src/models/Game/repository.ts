import { API_URL } from '@/config/config';

export const createGame = async (gameData: any): Promise<any> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}/api/games/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(gameData),
  });
};
