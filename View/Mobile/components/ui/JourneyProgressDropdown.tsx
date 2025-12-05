import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';

// ============================================================================
// TYPES
// ============================================================================
interface JourneyStep {
  /** Step number (1-4) */
  number: number;
  /** Step label */
  label: string;
  /** Whether the step is completed */
  completed?: boolean;
}

interface JourneyProgressDropdownProps {
  /** Current active step (1-based) */
  currentStep: number;
  /** Custom steps (defaults to adoption journey steps) */
  steps?: JourneyStep[];
  /** Color for completed/active steps */
  activeColor?: string;
  /** Color for inactive steps */
  inactiveColor?: string;
  /** Current step description */
  currentDescription?: string;
  /** Next step description */
  nextDescription?: string;
  /** Callback when "Learn more" is pressed */
  onLearnMore?: () => void;
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// DEFAULT STEPS - Matching journey steps
// ============================================================================
const DEFAULT_STEPS: JourneyStep[] = [
  { number: 1, label: 'Browse' },
  { number: 2, label: 'Pre-Match' },
  { number: 3, label: 'Apply' },
  { number: 4, label: 'Match' },
];

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * JourneyProgressDropdown - A collapsible card showing journey progress
 * 
 * Usage:
 * ```tsx
 * <JourneyProgressDropdown
 *   currentStep={1}
 *   currentDescription="Browse elders to find your match"
 *   nextDescription="Choose & chat anonymously for 7-14 days"
 *   onLearnMore={() => openWalkthrough()}
 * />
 * ```
 */
export const JourneyProgressDropdown: React.FC<JourneyProgressDropdownProps> = ({
  currentStep,
  steps = DEFAULT_STEPS,
  activeColor = '#9DE2D0',
  inactiveColor = '#E0E0E0',
  currentDescription = 'Browse elders to find your match',
  nextDescription = 'Choose & chat anonymously for 7-14 days',
  onLearnMore,
  style,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header - Always visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.pinIcon}>📍</Text>
          <Text style={styles.headerTitle}>Your Journey</Text>
        </View>
        <Text style={styles.dropdownIcon}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Expandable Content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Step Indicators */}
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => {
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;
              const isLast = index === steps.length - 1;

              return (
                <React.Fragment key={step.number}>
                  {/* Step Circle and Label */}
                  <View style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepCircle,
                        {
                          backgroundColor: isActive || isCompleted ? activeColor : '#FFFFFF',
                          borderColor: isActive || isCompleted ? activeColor : inactiveColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepNumber,
                          { color: isActive || isCompleted ? '#333' : '#999' },
                        ]}
                      >
                        {step.number}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        { color: isActive || isCompleted ? '#333' : '#999' },
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>

                  {/* Connector Line */}
                  {!isLast && (
                    <View
                      style={[
                        styles.connector,
                        {
                          backgroundColor: isCompleted ? activeColor : inactiveColor,
                        },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* Current Status */}
          <View style={styles.statusSection}>
            <View style={styles.statusRow}>
              <Text style={styles.pinIconSmall}>📍</Text>
              <Text style={styles.statusLabel}>You are here: </Text>
              <Text style={styles.statusText}>{currentDescription}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.nextIcon}>⏭️</Text>
              <Text style={styles.statusLabel}>Next: </Text>
              <Text style={styles.statusText}>{nextDescription}</Text>
            </View>
          </View>

          {/* Learn More Link */}
          <TouchableOpacity
            style={styles.learnMoreButton}
            onPress={onLearnMore}
            activeOpacity={0.7}
          >
            <Text style={styles.learnMoreText}>Learn more about the process →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  connector: {
    height: 2,
    width: 24,
    marginTop: 17, // Center with circle
    marginHorizontal: 4,
  },
  statusSection: {
    backgroundColor: '#F8FBF8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pinIconSmall: {
    fontSize: 14,
    marginRight: 4,
  },
  nextIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  statusText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  learnMoreButton: {
    alignItems: 'flex-start',
  },
  learnMoreText: {
    fontSize: 13,
    color: '#4A9B8C',
    fontWeight: '500',
  },
});

export default JourneyProgressDropdown;
