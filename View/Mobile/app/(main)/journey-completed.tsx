import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { JourneyCompletedScreen } from "../../StageUI/JourneyCompleted";

export default function JourneyCompletedPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const userId = params.userId as string | undefined;

  // No auto-redirect timer. Screen waits for user to press "Continue" in JourneyCompletedScreen.

  if (!userId) {
    console.error("[JourneyCompletedPage] No userId in params");
    return null;
  }

  return <JourneyCompletedScreen userId={userId} />;
}
