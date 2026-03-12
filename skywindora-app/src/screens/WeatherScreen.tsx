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
} from "react-native";
import { Colors } from "../../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

const BASE_URL = "https://skywindora-production.up.railway.app/api";
const DEVICE_ID_KEY = "skywindora_device_id";

const getWeatherIcon = (code: number) => {
  if (code === 0 || code === 1) return "☀️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 55) return "🌦️";
  if (code >= 61 && code <= 65) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌩️";
  if (code >= 95) return "⛈️";
  return "🌡️";
};

const getWeatherCondition = (code: number) => {
  const conditions: { [key: number]: string } = {
    0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
    45: "Foggy", 48: "Icy Fog", 51: "Light Drizzle", 53: "Moderate Drizzle",
    55: "Heavy Drizzle", 61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
    71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow", 80: "Slight Showers",
    81: "Moderate Showers", 82: "Heavy Showers", 95: "Thunderstorm",
  };
  return conditions[code] || "Unknown";
};

const getDayName = (dateStr: string) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[new Date(dateStr).getDay()];
};

export default function WeatherScreen({ route, navigation }: any) {
  const { data } = route.params || {};
  const [activeTab, setActiveTab] = useState<"current" | "hourly" | "daily" | "ai">("current");
  const [aiBriefing, setAiBriefing] = useState<string>("");
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setSaved(false);
      setAiBriefing("");
      setActiveTab("current");
    }, [])
  );

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🌤️</Text>
          <Text style={styles.emptyTitle}>No Weather Data</Text>
          <Text style={styles.emptySubtitle}>Search a city from the home screen</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Home")}>
            <Text style={styles.backBtnText}>Go to Search</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (saved) return;
    try {
      let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = "device_" + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      }
      await axios.post(`${BASE_URL}/saved`, {
        deviceId,
        type: "city",
        name: data.location.city,
        query: data.location.city,
        country: data.location.country,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
      });
      setSaved(true);
      Alert.alert("Saved!", `${data.location.city} added to saved locations.`);
    } catch (err) {
      Alert.alert("Error", "Could not save location.");
    }
  };

  const fetchAIBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const res = await axios.post(`${BASE_URL}/ai/briefing`, { weatherData: data, type: "city" });
      setAiBriefing(res.data.briefing);
    } catch (err) {
      setAiBriefing("AI briefing unavailable. Please try again.");
    } finally {
      setLoadingBriefing(false);
    }
  };

  const windDegToDir = (deg: number) => {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.cityName}>{data.location.city}</Text>
              <Text style={styles.countryName}>{data.location.country}</Text>
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, saved && styles.saveBtnSaved]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>{saved ? "⭐ Saved" : "☆ Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Weather Card */}
        <View style={styles.mainCard}>
          <Text style={styles.weatherEmoji}>
            {getWeatherIcon(data.current.weatherCode)}
          </Text>
          <Text style={styles.temperature}>{data.current.temperature}°C</Text>
          <Text style={styles.condition}>
            {getWeatherCondition(data.current.weatherCode)}
          </Text>
          <Text style={styles.feelsLike}>
            Feels like {data.current.feelsLike}°C
          </Text>
          <View style={styles.minMaxRow}>
            <Text style={styles.minMax}>↓ {Math.round(data.daily.minTemps[0])}°</Text>
            <Text style={styles.minMaxSep}>·</Text>
            <Text style={styles.minMax}>↑ {Math.round(data.daily.maxTemps[0])}°</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: "Humidity", value: `${data.current.humidity}%`, icon: "💧" },
            { label: "Wind", value: `${data.current.windSpeed} km/h`, icon: "💨" },
            { label: "Direction", value: windDegToDir(data.current.windDirection), icon: "🧭" },
            { label: "Pressure", value: `${data.current.pressure} hPa`, icon: "⏱️" },
            { label: "Visibility", value: `${(data.current.visibility / 1000).toFixed(1)} km`, icon: "👁️" },
            { label: "Sunrise", value: data.daily.sunrise[0]?.slice(11, 16) || "N/A", icon: "🌅" },
          ].map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: "current", label: "Now" },
            { key: "hourly", label: "Hourly" },
            { key: "daily", label: "7 Days" },
            { key: "ai", label: "🤖 AI" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Tab */}
        {activeTab === "current" && (
          <View style={styles.tabContent}>
            <View style={styles.sunCard}>
              <View style={styles.sunItem}>
                <Text style={styles.sunIcon}>🌅</Text>
                <Text style={styles.sunLabel}>Sunrise</Text>
                <Text style={styles.sunTime}>
                  {data.daily.sunrise[0]?.slice(11, 16) || "N/A"}
                </Text>
              </View>
              <View style={styles.sunDivider} />
              <View style={styles.sunItem}>
                <Text style={styles.sunIcon}>🌇</Text>
                <Text style={styles.sunLabel}>Sunset</Text>
                <Text style={styles.sunTime}>
                  {data.daily.sunset[0]?.slice(11, 16) || "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.cardTitle}>Wind Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Speed</Text>
                <Text style={styles.detailValue}>{data.current.windSpeed} km/h</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Direction</Text>
                <Text style={styles.detailValue}>
                  {data.current.windDirection}° {windDegToDir(data.current.windDirection)}
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.cardTitle}>Atmosphere</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pressure</Text>
                <Text style={styles.detailValue}>{data.current.pressure} hPa</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>{data.current.humidity}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Visibility</Text>
                <Text style={styles.detailValue}>
                  {(data.current.visibility / 1000).toFixed(1)} km
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Hourly Tab */}
        {activeTab === "hourly" && (
          <View style={styles.tabContent}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.hourlyRow}>
                {data.hourly.times.map((time: string, index: number) => (
                  <View key={index} style={styles.hourlyCard}>
                    <Text style={styles.hourlyTime}>{time.slice(11, 16)}</Text>
                    <Text style={styles.hourlyIcon}>
                      {getWeatherIcon(data.hourly.weatherCodes[index])}
                    </Text>
                    <Text style={styles.hourlyTemp}>
                      {Math.round(data.hourly.temperatures[index])}°
                    </Text>
                    <Text style={styles.hourlyHumidity}>
                      💧{data.hourly.humidity[index]}%
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Daily Tab */}
        {activeTab === "daily" && (
          <View style={styles.tabContent}>
            {data.daily.times.map((date: string, index: number) => (
              <View key={index} style={styles.dailyCard}>
                <Text style={styles.dailyDay}>
                  {index === 0 ? "Today" : getDayName(date)}
                </Text>
                <Text style={styles.dailyIcon}>
                  {getWeatherIcon(data.daily.weatherCodes[index])}
                </Text>
                <Text style={styles.dailyCondition}>
                  {getWeatherCondition(data.daily.weatherCodes[index])}
                </Text>
                <View style={styles.dailyTemps}>
                  <Text style={styles.dailyMin}>
                    {Math.round(data.daily.minTemps[index])}°
                  </Text>
                  <Text style={styles.dailyMax}>
                    {Math.round(data.daily.maxTemps[index])}°
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* AI Tab */}
        {activeTab === "ai" && (
          <View style={styles.tabContent}>
            <View style={styles.aiSection}>
              <Text style={styles.aiSectionTitle}>🤖 AI Weather Briefing</Text>
              <Text style={styles.aiSectionSubtitle}>
                Smart weather analysis and recommendations for your day
              </Text>

              {!aiBriefing && !loadingBriefing && (
                <TouchableOpacity style={styles.aiBtn} onPress={fetchAIBriefing}>
                  <Text style={styles.aiBtnText}>Generate Briefing</Text>
                </TouchableOpacity>
              )}

              {loadingBriefing && (
                <View style={styles.aiLoading}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.aiLoadingText}>Analyzing weather...</Text>
                </View>
              )}

              {aiBriefing ? (
                <View style={styles.aiBriefingCard}>
                  <Text style={styles.aiBriefingText}>{aiBriefing}</Text>
                  <TouchableOpacity onPress={fetchAIBriefing} style={styles.refreshBtn}>
                    <Text style={styles.refreshBtnText}>↻ Refresh</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backButton: { marginBottom: 8 },
  backArrow: { color: Colors.primary, fontSize: 14 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cityName: { fontSize: 36, fontWeight: "800", color: Colors.white },
  countryName: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  saveBtn: {
    backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 16,
    paddingVertical: 8, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  saveBtnSaved: { borderColor: Colors.warning, backgroundColor: Colors.backgroundSecondary },
  saveBtnText: { color: Colors.textPrimary, fontSize: 13, fontWeight: "600" },
  mainCard: {
    alignItems: "center", paddingVertical: 24, marginHorizontal: 20, marginTop: 12,
    backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  weatherEmoji: { fontSize: 64, marginBottom: 8 },
  temperature: { fontSize: 72, fontWeight: "800", color: Colors.white },
  condition: { fontSize: 18, color: Colors.textSecondary, marginTop: 4 },
  feelsLike: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  minMaxRow: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 },
  minMax: { color: Colors.textSecondary, fontSize: 16, fontWeight: "600" },
  minMaxSep: { color: Colors.textMuted, fontSize: 16 },
  statsGrid: {
    flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, marginTop: 16, gap: 10,
  },
  statCard: {
    backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: 12, width: "30%", alignItems: "center",
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { color: Colors.textPrimary, fontWeight: "700", fontSize: 13, textAlign: "center" },
  statLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 2, textAlign: "center" },
  tabs: {
    flexDirection: "row", marginHorizontal: 20, marginTop: 20,
    backgroundColor: Colors.card, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontWeight: "600", fontSize: 12 },
  tabTextActive: { color: Colors.white },
  tabContent: { paddingHorizontal: 20, marginTop: 16, paddingBottom: 30 },
  sunCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", marginBottom: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  sunItem: { flex: 1, alignItems: "center" },
  sunIcon: { fontSize: 28, marginBottom: 4 },
  sunLabel: { color: Colors.textMuted, fontSize: 12 },
  sunTime: { color: Colors.textPrimary, fontWeight: "700", fontSize: 18, marginTop: 4 },
  sunDivider: { width: 1, height: 50, backgroundColor: Colors.cardBorder },
  detailCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  cardTitle: { color: Colors.textPrimary, fontWeight: "700", fontSize: 15, marginBottom: 12 },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  detailLabel: { color: Colors.textMuted, fontSize: 13 },
  detailValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: "600" },
  hourlyRow: { flexDirection: "row", paddingBottom: 8, gap: 10 },
  hourlyCard: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    alignItems: "center", width: 70, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  hourlyTime: { color: Colors.textMuted, fontSize: 11, marginBottom: 6 },
  hourlyIcon: { fontSize: 22, marginBottom: 6 },
  hourlyTemp: { color: Colors.textPrimary, fontWeight: "700", fontSize: 14 },
  hourlyHumidity: { color: Colors.textMuted, fontSize: 10, marginTop: 4 },
  dailyCard: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center", marginBottom: 8,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  dailyDay: { color: Colors.textPrimary, fontWeight: "700", fontSize: 14, width: 50 },
  dailyIcon: { fontSize: 22, marginHorizontal: 12 },
  dailyCondition: { color: Colors.textSecondary, fontSize: 12, flex: 1 },
  dailyTemps: { flexDirection: "row", gap: 8 },
  dailyMin: { color: Colors.textMuted, fontSize: 14, fontWeight: "600" },
  dailyMax: { color: Colors.textPrimary, fontSize: 14, fontWeight: "700" },
  aiSection: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  aiSectionTitle: { color: Colors.textPrimary, fontWeight: "700", fontSize: 16, marginBottom: 4 },
  aiSectionSubtitle: { color: Colors.textMuted, fontSize: 12, marginBottom: 16 },
  aiBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 12, alignItems: "center",
  },
  aiBtnText: { color: Colors.white, fontWeight: "700", fontSize: 14 },
  aiLoading: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  aiLoadingText: { color: Colors.textSecondary, fontSize: 13 },
  aiBriefingCard: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  aiBriefingText: { color: Colors.textPrimary, fontSize: 13, lineHeight: 22 },
  refreshBtn: { alignItems: "center", paddingVertical: 8 },
  refreshBtnText: { color: Colors.primary, fontSize: 13 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 14, textAlign: "center", marginBottom: 24 },
  backBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: Colors.white, fontWeight: "700" },
});