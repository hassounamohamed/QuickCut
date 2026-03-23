import { Redirect } from 'expo-router';

import { useAuthContext } from '@/context/AuthContext';

export default function IndexScreen() {
  const { isAuthenticated, isBarber } = useAuthContext();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={isBarber ? '/(barber)/dashboard' : '/(tabs)/home'} />;
}
