import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner, Header } from '../components/ui';

interface AgeVerificationCameraProps {
  onCaptured: (uri: string) => void;
  onCancel: () => void;
}

/**
 * Lightweight camera capture screen for UC103 age verification prototype.
 * Uses Expo Camera with an IC-shaped overlay; once a photo is taken we
 * immediately treat it as verified and hand control back to the parent.
 */
export const AgeVerificationCamera: React.FC<AgeVerificationCameraProps> = ({
  onCaptured,
  onCancel,
}) => {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[AgeVerificationCamera] Unmounting - cleaning up');
      cameraRef.current = null;
    };
  }, []);

  const handleTakePhoto = async () => {
    if (!cameraRef.current || !isReady || isCapturing) return;

    setIsCapturing(true);
    console.log('[AgeVerificationCamera] Taking photo...');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });

      if (photo?.uri) {
        console.log('[AgeVerificationCamera] Photo captured, uri:', photo.uri.substring(0, 50));

        // Clear camera ref before calling onCaptured
        cameraRef.current = null;

        // Small delay to ensure camera is fully stopped before transitioning
        // This helps prevent the camera from staying on top on some devices
        setTimeout(() => {
          console.log('[AgeVerificationCamera] Calling onCaptured');
          onCaptured(photo.uri);
        }, 100);
      }
    } catch (error) {
      console.warn('[AgeVerificationCamera] Capture failed:', error);
      setIsCapturing(false);
    }
  };

  const renderPermissionNotice = () => (
    <View style={styles.permissionContainer}>
      <AlertBanner
        type="warning"
        message="Camera access is needed to verify your IC. Please allow camera permission."
        icon="dY•”"
      />
      <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
        <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
        <Text style={styles.secondaryButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="IC Capture" onBack={onCancel} />
        {renderPermissionNotice()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Scan Your IC" onBack={onCancel} />
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={() => setIsReady(true)}
        >
          <View style={styles.overlay}>
            <View style={styles.icFrame} />
            <Text style={styles.overlayText}>Align your IC within the frame</Text>
          </View>
        </CameraView>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={28} color="#FFF" />
            <Text style={styles.captureText}>Capture</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  icFrame: {
    width: '80%',
    aspectRatio: 1.6, // IC-like rectangle
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FADE9F',
    backgroundColor: 'rgba(255, 253, 245, 0.06)',
  },
  overlayText: {
    color: '#FFFDF5',
    marginTop: 16,
    fontWeight: '600',
  },
  controls: {
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7ECEC5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    gap: 8,
  },
  captureText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    padding: 24,
    gap: 16,
    backgroundColor: '#FFFDF5',
  },
  permissionButton: {
    backgroundColor: '#7ECEC5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#555',
    fontWeight: '600',
  },
});

export default AgeVerificationCamera;
