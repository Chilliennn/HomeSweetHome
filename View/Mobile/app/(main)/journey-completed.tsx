import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { JourneyCompletedScreen } from "../../StageUI/JourneyCompleted";

export default function JourneyCompletedPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const userId = params.userId as string | undefined;

  useEffect(() => {
    // Show the celebration screen briefly, then return user to bonding.
    // Use the public route path (no grouping folder like (main)).
    const timer = setTimeout(() => {
      if (!userId) {
        // avoid navigating to an unmatched route if we don't have userId
        // keep the screen visible so the app doesn't crash.
        // eslint-disable-next-line no-console
        console.warn("[JourneyCompleted] missing userId — aborting redirect");
        return;
      }

      try {
        router.replace({ pathname: "/bonding", params: { userId } });
      } catch (err) {
        // fallback to string path if the object form fails for any reason
        // eslint-disable-next-line no-console
        console.warn("[JourneyCompleted] router.replace failed, falling back to string path", err);
        router.replace(`/bonding?userId=${encodeURIComponent(userId)}`);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, userId]);

  return <JourneyCompletedScreen />;
}
