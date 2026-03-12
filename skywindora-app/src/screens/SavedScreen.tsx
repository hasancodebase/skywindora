import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Colors } from "../../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

const BASE_URL = "https://skywindora-production.up.railway.app/api";
const DEVICE_ID_KEY = "skywindora_device_id";

export default function SavedScreen({ navigation }: any) {
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchSaved();
    }, [])
  );

  const getOrCreateDeviceId = async () => {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = "device_" + Math.random().toString(36).substr(2, 9);
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  };

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const res = await axios.get(`${BASE_URL}/saved/${deviceId}`);
      setSavedLocations(res.data);
    } catch (err) {
      console.log("Fetch saved error:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSaved();
    setRefreshing(false);
  };

  const handleDelete = async (id: string, name: string) => {
    Alert.alert(
      "Remove Saved Location",
      `Remove ${name} from saved locations?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${BASE_URL}/saved/${id}`);
              setSavedLocations((prev) => prev.filter((loc) => loc._id !== id));
            } catch (err) {
              Alert.alert("Error", "Could not remove location.");
            }
          },
        },
      ]
    );
  };

  const handleOpen = async (location: any) => {
    try {
      setLoading(true);
      if (location.type === "aviation") {
        const res = await axios.get(`${BASE_URL}/aviation/${location.query}`);
        navigation.navigate("Aviation", { data: res.data, query: location.query });
      } else {
        const res = await axios.get(`${BASE_URL}/weather/${location.query}`);
        navigation.navigate("Weather", { data: res.data, query: location.query });
      }
    } catch (err) {
      Alert.alert("Error", "Could not load location data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>⭐ Saved Locations</Text>
        <Text style={styles.subtitle}>Your favorite airports and cities</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading saved locations...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {savedLocations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🗺️</Text>
              <Text style={styles.emptyTitle}>No Saved Locations</Text>
              <Text style={styles.emptySubtitle}>
                Search for an airport or city and tap{" "}
                <Text style={styles.emptyHighlight}>☆ Save</Text> to add it here
              </Text>
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={() => navigation.navigate("Home")}
              >
                <Text style={styles.searchBtnText}>Search Locations</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              <Text style={styles.countText}>
                {savedLocations.length} saved location{savedLocations.length !== 1 ? "s" : ""}
              </Text>

              {savedLocations.map((location) => (
                <TouchableOpacity
                  key={location._id}
                  style={styles.locationCard}
                  onPress={() => handleOpen(location)}
                >
                  <View style={styles.locationIcon}>
                    <Text style={styles.locationIconText}>
                      {location.type === "aviation" ? "✈️" : "🏙️"}
                    </Text>
                  </View>

                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{location.name}</Text>
                    <Text style={styles.locationType}>
                      {location.type === "aviation" ? "Airport · ICAO" : "City · Weather"}
                    </Text>
                    <Text style={styles.locationDate}>
                      Saved {new Date(location.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.locationActions}>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(location._id, location.name);
                      }}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                    <Text style={styles.openArrow}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: Colors.white },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 },
  loadingText: { color: Colors.textSecondary, fontSize: 14, marginTop: 12 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: "700", marginBottom: 10 },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  emptyHighlight: { color: Colors.primary, fontWeight: "700" },
  searchBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  searchBtnText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  countText: { color: Colors.textMuted, fontSize: 13, marginBottom: 12 },
  locationCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", marginBottom: 10,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  locationIcon: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.backgroundSecondary,
    alignItems: "center", justifyContent: "center", marginRight: 14,
  },
  locationIconText: { fontSize: 22 },
  locationInfo: { flex: 1 },
  locationName: { color: Colors.textPrimary, fontWeight: "700", fontSize: 16 },
  locationType: { color: Colors.primary, fontSize: 12, marginTop: 2 },
  locationDate: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  locationActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.ifr,
  },
  
  deleteBtnText: { color: Colors.ifr, fontSize: 12, fontWeight: "700" },
  openArrow: { color: Colors.textMuted, fontSize: 24, fontWeight: "300" },
});