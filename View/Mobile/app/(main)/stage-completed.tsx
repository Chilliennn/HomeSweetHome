import { useLocalSearchParams } from "expo-router";
import { StageCompletedScreen } from "../../StageUI/StageCompleted";

export default function StageCompletedPage() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;

  return <StageCompletedScreen userId={userId} />;
}
