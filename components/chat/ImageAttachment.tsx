import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ImageStyle, StyleProp, View } from "react-native";

// Define the max width you want your image attachments to have in the chat
const MAX_IMAGE_WIDTH = 360;

type ImageAttachmentProps = {
  uri: string;
  baseStyle: StyleProp<ImageStyle>;
};

// Assuming this code is inside your renderMessage function or a sub-component for the message item:
export default function ImageAttachment({ uri, baseStyle }: ImageAttachmentProps) {
  const [imageDimensions, setImageDimensions] = useState({ width: MAX_IMAGE_WIDTH, height: 200 }); // Default temporary size
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch real image dimensions before rendering
    Image.getSize(
      uri,
      (width, height) => {
        // Calculate aspect ratio
        const aspectRatio = width / height;

        // Calculate necessary height to fit maxWidth while maintaining aspect ratio
        const calculatedHeight = MAX_IMAGE_WIDTH / aspectRatio;

        setImageDimensions({ width: MAX_IMAGE_WIDTH, height: calculatedHeight });
        setLoading(false);
      },
      (error) => {
        console.error("Could not get image size: ", error);
        setLoading(false);
        // Keep default dimensions on error
      },
    );
  }, [uri]);

  if (loading) {
    // Optional: Show a loader or placeholder while calculating size
    return (
      <View style={[baseStyle, { height: 200, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: uri }}
      // 2. Apply calculated dimensions dynamically over base styles
      style={[baseStyle, { width: imageDimensions.width, height: imageDimensions.height }]}
      // Since we calculated the exact container size to match the image ratio,
      // 'cover' will look perfect without cropping.
      resizeMode="cover"
    />
  );
}
