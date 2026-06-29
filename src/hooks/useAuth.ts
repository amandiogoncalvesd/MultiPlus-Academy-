import { useAuth as useAuthFromProvider } from '../components/auth/AuthProvider';

export function useAuth() {
  return useAuthFromProvider();
}
