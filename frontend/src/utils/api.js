const DEFAULT_API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL).trim();

export const buildApiUrl = (path) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

export const fetchJson = async (path, options = {}) => {
  const response = await fetch(buildApiUrl(path), options);
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!isJson) {
    throw new Error('API response was not JSON. Ensure backend is running and API route exists.');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'API request failed');
  }

  return data;
};
