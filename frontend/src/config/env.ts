const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  NODE_ENV: import.meta.env.MODE as string,
}

export default env
