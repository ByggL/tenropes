import { useChannelAdmin } from "@/hooks/useChannelAdmin";
import { ChannelMetadata } from "@/types/types";
import { optimizeThemeForReadability } from "@/utils/utils";
import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type QrCodeModalProps = {
  channel: ChannelMetadata;
};

export default function QrCodeModal({ channel }: QrCodeModalProps) {
  const theme = channel?.theme
    ? optimizeThemeForReadability(channel.theme)
    : {
        primary_color: "#E91E63",
        primary_color_dark: "#C2185B",
        accent_color: "#00BCD4",
        text_color: "#212121",
        accent_text_color: "#FFFFFF",
      };

  const { isQrModalVisible, setQrModalVisible, qrInviteLink, isLoadingQr } = useChannelAdmin(channel);

  return (
    <Modal animationType="slide" transparent={true} visible={isQrModalVisible} onRequestClose={() => setQrModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.primary_color_dark }]}>
          <Text style={[styles.modalTitle, { color: theme.text_color }]}>Scan to Join</Text>

          <View style={styles.qrContainer}>
            {isLoadingQr ? (
              <ActivityIndicator size="large" color={theme.accent_color} />
            ) : (
              <View style={styles.qrBackground}>
                {/* We wrap QRCode in a white view because dark QRs on dark backgrounds rarely scan well */}
                <QRCode value={qrInviteLink || "Loading..."} size={200} color="black" backgroundColor="white" />
              </View>
            )}
          </View>

          <Text style={[styles.modalLabel, { color: theme.accent_text_color, marginTop: 20 }]}>#{channel?.name}</Text>
          <Text style={[styles.modalLabel, { color: theme.accent_text_color, marginTop: 20 }]}>{qrInviteLink}</Text>

          <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.text_color, marginTop: 10 }]} onPress={() => setQrModalVisible(false)}>
            <Text style={{ color: theme.primary_color_dark, fontWeight: "bold" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  qrBackground: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
    // Optional: Add shadow to make the QR pop
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)", // Slightly darker overlay
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#444",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 15,
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 22,
  },
  modalBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
});
