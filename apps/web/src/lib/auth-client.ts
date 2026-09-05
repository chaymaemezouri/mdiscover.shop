export function storeAuthTokens(
  data: { accessToken: string; refreshToken: string },
  redirect = '/compte/commandes',
) {
  localStorage.setItem('access_token', data.accessToken);
  localStorage.setItem('refresh_token', data.refreshToken);
  window.location.href = redirect;
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  try {
    localStorage.removeItem('mdiscover-wishlist');
  } catch {
    /* ignore */
  }
}

export function logoutAccount(redirect = '/compte') {
  clearAuthTokens();
  window.location.href = redirect;
}
