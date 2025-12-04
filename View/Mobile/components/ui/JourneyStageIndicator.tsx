import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================
interface Stage {
  /** Stage number (1-4) */
  number: number;
  /** Stage label */
  label: string;
}

interface JourneyStageIndicatorProps {
  /** Current active stage (1-based) */
  currentStage: number;
  /** Custom stages (defaults to adoption journey stages) */
  stages?: Stage[];
  /** Color for completed/active stages */
  activeColor?: string;
  /** Color for inactive stages */
  inactiveColor?: string;
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// DEFAULT STAGES
// ============================================================================
const DEFAULT_STAGES: Stage[] = [
  { number: 1, label: 'Getting\nAcquainted' },
  { number: 2, label: 'Building\nTrust' },
  { number: 3, label: 'Family\nBond' },
  { number: 4, label: 'Full\nAdoption' },
];

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * JourneyStageIndicator - Shows progress through adoption journey stages
 * 
 * Usage:
 * ```tsx
 * <JourneyStageIndicator currentStage={1} />
 * <JourneyStageIndicator currentStage={2} activeColor="#9DE2D0" />
 * ```
 */
export const JourneyStageIndicator: React.FC<JourneyStageIndicatorProps> = ({
  currentStage,
  stages = DEFAULT_STAGES,
  activeColor = '#9DE2D0',
  inactiveColor = '#E0E0E0',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {stages.map((stage, index) => {
        const isActive = stage.number <= currentStage;
        const isLast = index === stages.length - 1;

        return (
          <React.Fragment key={stage.number}>
            {/* Stage circle and label */}
            <View style={styles.stageItem}>
              <View
                style={[
                  styles.circle,
                  { 
                    backgroundColor: isActive ? activeColor : '#FFFFFF',
                    borderColor: isActive ? activeColor : inactiveColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.circleText,
                    { color: isActive ? '#333' : '#999' },
                  ]}
                >
                  {stage.number}
                </Text>
              </View>
              <Text
                style={[
                  styles.label,
                  { color: isActive ? '#333' : '#999' },
                ]}
              >
                {stage.label}
              </Text>
            </View>

            {/* Connector line */}
            {!isLast && (
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor:
                      stage.number < currentStage ? activeColor : inactiveColor,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stageItem: {
    alignItems: 'center',
    width: 70,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  circleText: {
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
  connector: {
    height: 2,
    width: 20,
    marginTop: 21, // Center with circle
    marginHorizontal: -4,
  },
});

export default JourneyStageIndicator;
