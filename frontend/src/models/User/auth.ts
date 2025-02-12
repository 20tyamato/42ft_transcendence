function checkUserAccess(): string {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    throw new Error('Token does not exist, redirected to login page.');
  }
  return token;
}

function isLoggedIn(): boolean {
  return !!localStorage.getItem('token');
}

export { checkUserAccess, isLoggedIn };
