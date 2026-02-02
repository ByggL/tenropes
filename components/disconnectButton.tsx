import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

interface DisconnectButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  isLoading?: boolean;
  label?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const DisconnectButton: React.FC<DisconnectButtonProps> = ({
  onPress,
  isLoading = false,
  label = "Disconnect",
  style,
  textStyle,
  disabled = false,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isLoading}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
          (disabled || isLoading) && styles.disabled,
          style,
        ]}
      >
        {isLoading ? (
          // Spinner matches the text color
          <ActivityIndicator color="#EF4444" />
        ) : (
          <>
            <Text style={[styles.text, textStyle]}>{label}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // Soft Red Background (Modern "Danger" style)
    backgroundColor: "#FEF2F2",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    // Subtle shadow
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    backgroundColor: "#FEE2E2", // Slightly darker when held
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: "#EF4444", // Strong Red Text
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  icon: {
    marginRight: 10,
  },
});
