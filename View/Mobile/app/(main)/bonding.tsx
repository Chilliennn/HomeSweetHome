// ...existing code...
import React from "react";
import { useLocalSearchParams } from "expo-router";
import { StageProgressionScreen } from "../../StageUI/StageProgression";

export default function StageProgressionRoute() {
  const params = useLocalSearchParams();
  const { userId, openStage } = params as { userId?: string; openStage?: string };

  return <StageProgressionScreen userId={userId as string} initialOpenStage={openStage as string | undefined} />;
}