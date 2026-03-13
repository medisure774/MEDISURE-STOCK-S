export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function apiRequest(endpoint: string, options: any = {}) {
  const token = localStorage.getItem('medisure_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('medisure_user');
      localStorage.removeItem('medisure_token');
      window.location.href = '/login';
    }
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}
