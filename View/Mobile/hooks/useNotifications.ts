import { useEffect } from "react";
import { useRouter } from "expo-router";
import { authViewModel } from "@home-sweet-home/viewmodel";
import { pushNotificationService } from "../../../Model/Service/CoreService/pushNotificationService";
// ...existing code...

/**
 * useNotifications Hook
 *
 * Responsibility:
 * - Register push notifications when user logs in
 * - Setup notification listeners (foreground & tap)
 * - Handle navigation when notification is tapped
 *
 * Architecture:
 * - View Layer: This hook (reusable logic)
 * - Service Layer: pushNotificationService (business logic)
 * - No direct DB/Supabase access (follows MVVM rules)
 */
export function useNotifications() {
  const router = useRouter();
  const currentUserId = authViewModel.authState.currentUserId;

  useEffect(() => {
    // Don't setup notifications if user is not logged in
    if (!currentUserId) {
      console.log("🔴 [useNotifications] No user logged in, skipping");
      return;
    }

    console.log("🔵 [useNotifications] Initializing for user:", currentUserId);

    // 1. Register for push notifications
    pushNotificationService
      .registerForPushNotifications(currentUserId)
      .then((token: string | null) => {
        if (token) {
          console.log("✅ [useNotifications] Push token registered:", token);
        } else {
          console.warn("⚠️ [useNotifications] Failed to get push token");
        }
      })
      .catch((error: any) => {
        console.error("❌ [useNotifications] Registration error:", error);
      });

    // 2. Setup notification listeners
    const cleanup = pushNotificationService.setupNotificationListeners(
      // Handler: When notification received (app in foreground)
      (notification: any) => {
        console.log("📬 [useNotifications] Notification received:", {
          title: notification.request.content.title,
          body: notification.request.content.body,
        });
        // The notification will be displayed automatically
        // Additional custom logic can be added here if needed
      },

      // Handler: When notification tapped (user clicked on it)
      (response: any) => {
        const content = response.notification.request.content;
        const data = content.data as any;

        console.log("👆 [useNotifications] Notification tapped:", {
          title: content.title,
          type: data?.type,
        });

        // Navigate based on notification type
        if (
          data?.type === "new_interest" ||
          data?.type === "interest_accepted" ||
          data?.type === "interest_rejected"
        ) {
          console.log(
            "🔀 [useNotifications] Navigating to notification screen"
          );
          router.push("/(main)/notification");
        } else if (data?.type === "new_message") {
          console.log("🔀 [useNotifications] Navigating to chat screen");
          router.push("/(main)/chat");
        }
      }
    );

    // 3. Cleanup on unmount or user logout
    return () => {
      console.log("🔴 [useNotifications] Cleaning up");
      cleanup();
    };
  }, [currentUserId, router]);
}
