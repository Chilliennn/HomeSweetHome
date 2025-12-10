import { useLocalSearchParams } from "expo-router";
import { StageCompletedScreen } from "../../StageUI/StageCompleted";

export default function StageCompletedPage() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const stage = params.stage as string | undefined;

  return <StageCompletedScreen userId={userId} stage={stage} />;
}
