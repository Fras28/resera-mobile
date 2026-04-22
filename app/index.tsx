import { Redirect } from 'expo-router';

// La ruta raíz redirige al login.
// El AuthGuard en _layout.tsx se encarga de redirigir al dashboard
// correspondiente si el usuario ya tiene sesión activa.
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
