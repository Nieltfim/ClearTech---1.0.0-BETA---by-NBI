// Endereço do Backend. Defina EXPO_PUBLIC_API_URL no arquivo .env (veja .env.example).
// "localhost" NÃO funciona no celular: lá, localhost é o próprio celular.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.27:3000').replace(/\/$/, '');
