import { useLocalSearchParams } from "expo-router";
import { JourneyPauseScreen } from "../../StageUI/JourneyPause";

export default function JourneyPausePage() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;

  return <JourneyPauseScreen userId={userId} />;
}
