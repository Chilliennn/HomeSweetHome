import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface StageCircleProps {
  order: number;
  displayName: string;
  isCurrent: boolean;
  isCompleted: boolean;
  onPress: () => void;
  size?: number;
}

export const StageCircle: React.FC<StageCircleProps> = ({
  order,
  displayName,
  isCurrent,
  isCompleted,
  onPress,
  size,
}) => {
  const finalSize = size || CIRCLE_SIZE;
  // Determine circle style based on state
  const getCircleColor = () => {
    if (isCompleted) return "#D4E5AE"; // Light green for completed
    if (isCurrent) return "#9DE2D0"; // Teal for current
    return "#E8E8E8"; // Gray for locked
  };

  const getTextColor = () => {
    if (isCompleted || isCurrent) return "#333";
    return "#999";
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width: finalSize + 4 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Circle with checkmark or number */}
      <View
        style={[
          styles.circle,
          {
            backgroundColor: getCircleColor(),
            width: finalSize,
            height: finalSize,
            borderRadius: finalSize / 2,
          },
        ]}
      >
        {isCompleted ? (
          <Text style={[styles.checkmark, { fontSize: finalSize * 0.5 }]}>
            ✓
          </Text>
        ) : (
          <Text
            style={[
              styles.orderNumber,
              { color: getTextColor(), fontSize: finalSize * 0.45 },
            ]}
          >
            {order}
          </Text>
        )}
      </View>

      {/* Stage name below circle - Only show if displayName provided */}
      {displayName ? (
        <Text
          style={[
            styles.stageName,
            { color: getTextColor(), maxWidth: finalSize + 4 },
          ]}
          numberOfLines={2}
        >
          {displayName}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const CIRCLE_SIZE = 54;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 58,
    paddingTop: 0,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: "700",
  },
  checkmark: {
    fontSize: 28,
    color: "#333",
    fontWeight: "700",
  },
  stageName: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
    maxWidth: 58,
  },
});
export default StageCircle;
