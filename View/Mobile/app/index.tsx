import { Redirect } from 'expo-router';

/**
 * App Entry Point
 * 
 * Redirects to the login screen on app launch.
 * The login screen will then check profile completion status
 * and redirect accordingly.
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
