import { Redirect } from "expo-router";

/**
 * Root index — redirects to the appropriate screen.
 * TODO: When real auth is integrated, check isAuthenticated here
 * and redirect to /(tabs) if logged in, /onboarding if not.
 */
export default function Index() {
  // For now, always start at onboarding. Change to /(tabs) to skip auth flow.
  return <Redirect href="/onboarding" />;
}
