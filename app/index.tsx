// app/index.tsx
import { RootState } from "@/store";
import { Redirect } from "expo-router";
import { useSelector } from "react-redux";

export default function Index() {
  const accounts = useSelector((state: RootState) => state.servers?.accounts || {});
  const hasServers = Object.keys(accounts).length > 0;

  // The definitive traffic cop
  if (!hasServers) {
    return <Redirect href="/add-server" />;
  }

  return <Redirect href="/(tabs)/channelSelectionPage" />;
}
