import { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, Button } from "react-native";
import { Stack } from "expo-router";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SQLite from "expo-sqlite";
import { cleanupStorageGenerations } from "../src/infrastructure/filesystem/AttachmentFiles";
import { nativeDatabase } from "../src/infrastructure/database/native";
import { initialize } from "../src/infrastructure/database/connection";
import {
  createServices,
  Services,
  ServicesContext,
} from "../src/services/context";
import { useAppStore, ThemeMode } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import { message } from "../src/utils/values";
let initialization: Promise<Services> | undefined;
function boot() {
  initialization ??= (async () => {
    const db = await SQLite.openDatabaseAsync("notto.db");
    try {
      const fts = await initialize(nativeDatabase(db));
      try {
        await cleanupStorageGenerations(nativeDatabase(db));
      } catch {
        console.warn("Notto: storage cleanup deferred");
      }
      const services = createServices(db, fts);
      const mode = await services.settings.get("theme");
      if (["system", "light", "dark"].includes(mode ?? ""))
        useAppStore.getState().setTheme(mode as ThemeMode);
      return services;
    } catch (e) {
      await db.closeAsync();
      throw e;
    }
  })().catch((e) => {
    initialization = undefined;
    throw e;
  });
  return initialization;
}
export default function Root() {
  const t = useTheme();
  const busy = useAppStore((s) => s.busy);
  const [services, setServices] = useState<Services | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    boot()
      .then((s) => {
        if (active) setServices(s);
      })
      .catch((e) => {
        if (active) setError(message(e));
      });
    return () => {
      active = false;
    };
  }, [retry]);
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: t.surface }}
      >
        <StatusBar style={t.dark ? "light" : "dark"} />
        <ThemeProvider
          value={{
            ...(t.dark ? DarkTheme : DefaultTheme),
            colors: {
              ...(t.dark ? DarkTheme : DefaultTheme).colors,
              primary: t.primary,
              background: t.background,
              card: t.surface,
              text: t.text,
              border: t.border,
            },
          }}
        >
          {!services ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                padding: 30,
                gap: 16,
                backgroundColor: t.background,
              }}
            >
              {error ? (
                <>
                  <Text style={{ color: t.danger }}>{error}</Text>
                  <Button
                    title="Повторити"
                    onPress={() => setRetry((v) => v + 1)}
                  />
                </>
              ) : (
                <ActivityIndicator color={t.primary} />
              )}
            </View>
          ) : (
            <ServicesContext.Provider value={services}>
              <Stack
                screenOptions={{
                  headerBackTitle: "Назад",
                  contentStyle: { backgroundColor: t.background },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="notes/add"
                  options={{ title: "Нова нотатка", presentation: "modal" }}
                />
                <Stack.Screen
                  name="notes/[id]"
                  options={{ title: "Нотатка" }}
                />
                <Stack.Screen
                  name="notes/[id]/edit"
                  options={{ title: "Редагування", presentation: "modal" }}
                />
                <Stack.Screen name="catalog" options={{ title: "Довідники" }} />
                <Stack.Screen
                  name="collection"
                  options={{ title: "Колекція" }}
                />
              </Stack>
            </ServicesContext.Provider>
          )}
        </ThemeProvider>
        {busy && (
          <View
            accessibilityViewIsModal
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              backgroundColor: t.background + "E8",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
            }}
          >
            <ActivityIndicator size="large" color={t.primary} />
            <Text style={{ color: t.text }}>
              Зачекайте завершення операції…
            </Text>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
