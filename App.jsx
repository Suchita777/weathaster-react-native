import { View, Platform, StatusBar } from "react-native";
import { WebView } from "react-native-webview";

export default function App() {
  return (
    <View className="flex-1 flex-col">
      <StatusBar />
      <WebView
        originWhitelist={["*"]}
        source={{
          uri: "https://pushpak90.github.io/weather90.github.io/",
        }}
      />
    </View>
  );
}
