import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  Animated,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetDisplayMenu, getGetDisplayMenuQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import colors from "@/constants/colors";

const { width, height } = Dimensions.get("window");

export default function DisplayScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [imageKey, setImageKey] = useState(0);

  const { data, isLoading, isError, error } = useGetDisplayMenu(customerId || "", {
    query: {
      enabled: !!customerId,
      queryKey: getGetDisplayMenuQueryKey(customerId || ""),
      refetchInterval: 10000,
      staleTime: 5000,
    },
  });

  useEffect(() => {
    if (data?.updatedAt) {
      const updatedDate = new Date(data.updatedAt);
      if (!lastUpdated || updatedDate.getTime() !== lastUpdated.getTime()) {
        setLastUpdated(updatedDate);
        setImageKey((k) => k + 1);
      }
    }
  }, [data?.updatedAt]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  useEffect(() => {
    if (!process.env.EXPO_PUBLIC_DOMAIN || !customerId) return;
    const wsUrl = `wss://${process.env.EXPO_PUBLIC_DOMAIN}/ws?customerId=${encodeURIComponent(customerId)}`;
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    
    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "menu_update") {
              queryClient.invalidateQueries({ queryKey: getGetDisplayMenuQueryKey(customerId) });
            }
          } catch {}
        };
        ws.onerror = () => {
          reconnectTimer = setTimeout(connect, 5000);
        };
        ws.onclose = () => {
          reconnectTimer = setTimeout(connect, 5000);
        };
      } catch {}
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      try { ws?.close(); } catch {}
    };
  }, [customerId, queryClient]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.light.primary} />
        <Text style={styles.loadingText}>Loading menu for {customerId}...</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.errorIcon}>
          <Feather name="alert-triangle" size={48} color={colors.light.primary} />
        </View>
        <Text style={styles.errorTitle}>No Menu Found</Text>
        <Text style={styles.errorSubtitle}>
          {customerId} has no active menu yet.{"\n"}Check back after the admin uploads one.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
          <Feather name="arrow-left" size={16} color="#fff" />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        key={imageKey}
        source={{ uri: `https://${process.env.EXPO_PUBLIC_DOMAIN}${data.imageUrl}` }}
        style={styles.menuImage}
        resizeMode="contain"
      />

      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backChip} onPress={handleBack} activeOpacity={0.7} testID="button-back">
          <Feather name="arrow-left" size={16} color="#fff" />
        </TouchableOpacity>

        <View style={styles.liveIndicator}>
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) }]}>
        <Text style={styles.restaurantName} numberOfLines={1}>{data.restaurantName}</Text>
        <Text style={styles.customerIdText}>{data.customerId}</Text>
        {lastUpdated && (
          <Text style={styles.updatedText}>
            Updated {lastUpdated.toLocaleTimeString()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  menuImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  backChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(234,88,12,0.4)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.light.primary,
  },
  liveText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: colors.light.primary,
    letterSpacing: 1.5,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 20,
    paddingTop: 14,
    zIndex: 10,
  },
  restaurantName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 2,
  },
  customerIdText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: colors.light.mutedForeground,
    marginBottom: 4,
  },
  updatedText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    marginBottom: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    textAlign: "center",
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    marginBottom: 10,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
