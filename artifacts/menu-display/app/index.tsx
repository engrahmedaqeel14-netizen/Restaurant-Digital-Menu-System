import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";

export default function HomeScreen() {
  const [customerId, setCustomerId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleNavigate = useCallback(async () => {
    const id = customerId.trim().toUpperCase();
    if (!id) {
      setError("Please enter a Customer ID");
      return;
    }
    if (!/^REST\d{3}$/.test(id)) {
      setError("Format: REST001, REST002, etc.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      router.push(`/display/${id}`);
    } finally {
      setLoading(false);
    }
  }, [customerId, router]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPad + 40, paddingBottom: insets.bottom + 34 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconBadge}>
            <Feather name="monitor" size={40} color={colors.light.primary} />
          </View>
        </View>

        <Text style={styles.title}>MenuBoard</Text>
        <Text style={styles.subtitle}>Restaurant Digital Menu Display</Text>

        <View style={styles.card}>
          <Text style={styles.label}>CUSTOMER ID</Text>
          <View style={[styles.inputRow, error ? styles.inputError : null]}>
            <Feather name="hash" size={18} color={colors.light.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={customerId}
              onChangeText={(t) => {
                setCustomerId(t);
                setError("");
              }}
              placeholder="REST001"
              placeholderTextColor={colors.light.mutedForeground}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleNavigate}
              testID="input-customer-id"
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleNavigate}
            disabled={loading}
            activeOpacity={0.8}
            testID="button-navigate"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Open Display</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Feather name="info" size={16} color={colors.light.mutedForeground} />
          <Text style={styles.infoText}>
            Open this screen on a TV, tablet, or monitor. The menu updates automatically when the admin uploads a new image.
          </Text>
        </View>

        <View style={styles.examplesRow}>
          {["REST001", "REST002", "REST003"].map((id) => (
            <TouchableOpacity
              key={id}
              style={styles.exampleChip}
              onPress={() => {
                setCustomerId(id);
                setError("");
              }}
              testID={`chip-${id}`}
            >
              <Text style={styles.exampleChipText}>{id}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBadge: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.light.card,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    marginBottom: 40,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.light.border,
    padding: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.mutedForeground,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.accent,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.light.border,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputError: {
    borderColor: colors.light.destructive,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 17,
    fontFamily: "Inter_500Medium",
    color: colors.light.foreground,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.light.destructive,
    marginTop: -8,
    marginBottom: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.light.primary,
    borderRadius: 10,
    height: 52,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.light.border,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    lineHeight: 19,
  },
  examplesRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  exampleChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.light.secondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  exampleChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.light.mutedForeground,
  },
});
