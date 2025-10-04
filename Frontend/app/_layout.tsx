import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import store from "@/hooks/redux/store";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Provider store={store}>
        <Slot />
      </Provider>
    </SafeAreaProvider>
  );
}
