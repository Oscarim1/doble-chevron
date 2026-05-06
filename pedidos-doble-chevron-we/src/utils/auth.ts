export const parseTokenPayload = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1] || ''));
  } catch {
    return null;
  }
};

export const getUserIdFromToken = () => {
  const payload = parseTokenPayload();
  return payload ? payload.id || payload.user_id || payload.sub || null : null;
};

export const getUserRoleFromToken = () => {
  const payload = parseTokenPayload();
  return payload ? payload.role || payload.rol || null : null;
};
