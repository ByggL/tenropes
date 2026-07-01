import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  ListRenderItem,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import uuid from "react-native-uuid";

// structure d'un fichier média klipy
interface KlipyMediaFile {
  url: string;
  width?: number;
  height?: number;
  size?: number;
}

// formats retournés par l'api
interface KlipyGifFormats {
  gif?: KlipyMediaFile;
  mp4?: KlipyMediaFile;
  webp?: KlipyMediaFile;
  jpg?: KlipyMediaFile;
  webm?: KlipyMediaFile;
}

interface KlipyGifResolutions {
  hd?: KlipyGifFormats;
  md?: KlipyGifFormats;
  sm?: KlipyGifFormats;
  xs?: KlipyGifFormats;
}

// objet gif racine
interface KlipyGif {
  id: string | number;
  title?: string;
  slug: string;
  file?: KlipyGifResolutions;
}

// réponse globale api klipy
interface KlipyApiResponse {
  data?: KlipyGif[];
}

// props du composant modal
interface KlipyGifPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (gif: KlipyGif) => void;
}

const KlipyGifPicker = ({ visible, onClose, onSelect }: KlipyGifPickerProps) => {
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState<KlipyGif[]>([]);

  const apiKey = process.env.EXPO_PUBLIC_KLIPY_API_KEY;

  const customerId = uuid.v4();

  // gestion des requêtes
  useEffect(() => {
    const fetchGifs = async () => {
      // url klipy, endpoint selon recherche
      const endpoint = search.trim() === "" ? "trending?page=1" : `search?q=${encodeURIComponent(search)}`;
      const url = `https://api.klipy.com/api/v1/${apiKey}/gifs/${endpoint}&customer_id=${customerId}&locale=fr&format_filter=gif&content_filter=off`;

      try {
        let myHeaders = new Headers();

        const response = await fetch(url, { method: "GET", headers: myHeaders, redirect: "follow" });
        // console.log(JSON.stringify(response.text()));
        const data = await response.json();
        // console.log(JSON.stringify(data));

        setGifs(data.data.data || []);
      } catch (error) {
        console.error("Klipy api error", error);
      }
    };

    // délai anti-spam, 300ms
    const timer = setTimeout(fetchGifs, 300);

    // nettoyage timer
    return () => clearTimeout(timer);
  }, [search, apiKey]);

  // rendu élément
  const renderItem: ListRenderItem<KlipyGif> = ({ item }: { item: KlipyGif }) => (
    <TouchableOpacity onPress={() => onSelect(item)} style={styles.item}>
      <Image
        // médias stockés sous files, api klipy
        source={{ uri: item.file?.sm?.gif?.url }}
        style={styles.gif}
      />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* respect attribution klipy */}
          <TextInput
            style={styles.input}
            placeholder="Search KLIPY"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#888"
          />

          <FlatList
            data={gifs}
            keyExtractor={(item) => (item.id || Math.random()).toString()}
            numColumns={2}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// styles standards discord
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "80%",
    backgroundColor: "#36393f",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  input: {
    backgroundColor: "#202225",
    color: "#dcddde",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  list: {
    paddingBottom: 20,
  },
  item: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
  },
  gif: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#2f3136",
  },
  closeBtn: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#5865F2",
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});

export default KlipyGifPicker;
