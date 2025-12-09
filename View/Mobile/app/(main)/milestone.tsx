import { useLocalSearchParams } from "expo-router";
import { MilestoneReachedScreen } from "../../StageUI/MilestoneReached";

export default function MilestonePage() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;

  return <MilestoneReachedScreen userId={userId} />;
}
