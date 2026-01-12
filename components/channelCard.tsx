import { ChannelMetadata, MessageMetadata } from "@/types/types";
import { useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";

interface ChatChannelProps {
  channel: ChannelMetadata;
  messages: MessageMetadata[];
}
export default function ChannelCard({
  channelMetadata,
}: {
  channelMetadata: ChannelMetadata;
}) {
  const router = useRouter();

  return (
    <View>
      <Pressable
        onPress={() => {
          console.log("Access to channel:", channelMetadata.name);
          const props: ChatChannelProps = {
            channel: channelMetadata,
            messages: [],
          };
          router.push({
            pathname: "/(tabs)/channelPage",
            params: {
              // serialize objects to strings
              channel: JSON.stringify(channelMetadata),
              // It is recommended to fetch messages on the next page rather than passing them here
              messages: JSON.stringify([]),
            },
          });
        }}
      >
        <Image
          source={{
            uri: channelMetadata.img,
          }}
        />
        <Text>{channelMetadata.name}</Text>
      </Pressable>
    </View>
  );
}
