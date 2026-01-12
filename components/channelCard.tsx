import { Image, Pressable, Text, View } from "react-native";

export default function ChannelCard({
  channelId,
  channelImg,
  channelName,
}: {
  channelId: number;
  channelImg: string;
  channelName: string;
}) {
  return (
    <View>
      <Pressable
        onPress={() => {
          console.log("Access to channel:", channelName);
        }}
      >
        <Image
          source={{
            uri: channelImg,
          }}
        />
        <Text>{channelName}</Text>
      </Pressable>
    </View>
  );
}
