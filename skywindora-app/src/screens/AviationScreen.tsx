import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { Colors, FlightCategoryColors, FlightCategoryDescriptions } from "../../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

const BASE_URL = "https://skywindora-production.up.railway.app/api";
const DEVICE_ID_KEY = "skywindora_device_id";

export default function AviationScreen({ route, navigation }: any) {
  const { data, query } = route.params || {};
  const [activeTab, setActiveTab] = useState<"metar" | "taf" | "ai">("metar");
  const [aiBriefing, setAiBriefing] = useState<string>("");
  const [goNoGo, setGoNoGo] = useState<any>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [loadingGoNoGo, setLoadingGoNoGo] = useState(false);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setSaved(false);
      setAiBriefing("");
      setGoNoGo(null);
      setActiveTab("metar");
    }, [])
  );

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✈️</Text>
          <Text style={styles.emptyTitle}>No Aviation Data</Text>
          <Text style={styles.emptySubtitle}>Search an ICAO code from the home screen</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Home")}>
            <Text style={styles.backBtnText}>Go to Search</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = FlightCategoryColors[data.flightCategory as keyof typeof FlightCategoryColors] || Colors.unknown;
  const categoryDesc = FlightCategoryDescriptions[data.flightCategory as keyof typeof FlightCategoryDescriptions] || "";

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
        type: "aviation",
        name: data.airport.icao,
        query: data.airport.icao,
      });
      setSaved(true);
      Alert.alert("Saved!", `${data.airport.icao} added to saved locations.`);
    } catch (err) {
      Alert.alert("Error", "Could not save location.");
    }
  };

  const fetchAIBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const res = await axios.post(`${BASE_URL}/ai/briefing`, { weatherData: data, type: "aviation" });
      setAiBriefing(res.data.briefing);
    } catch (err) {
      setAiBriefing("AI briefing unavailable. Please try again.");
    } finally {
      setLoadingBriefing(false);
    }
  };

  const fetchGoNoGo = async () => {
    setLoadingGoNoGo(true);
    try {
      const res = await axios.post(`${BASE_URL}/ai/gonogo`, { weatherData: data });
      setGoNoGo(res.data);
    } catch (err) {
      setGoNoGo(null);
    } finally {
      setLoadingGoNoGo(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict === "GO") return Colors.vfr;
    if (verdict === "NO-GO") return Colors.ifr;
    return Colors.warning;
  };

  const getRiskColor = (risk: string) => {
    if (risk === "LOW") return Colors.vfr;
    if (risk === "MEDIUM") return Colors.warning;
    if (risk === "HIGH") return Colors.ifr;
    return Colors.lifr;
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
              <Text style={styles.icaoTitle}>{data.airport.icao}</Text>
              <Text style={styles.airportName}>{data.airport.name}</Text>
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, saved && styles.saveBtnSaved]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>{saved ? "⭐ Saved" : "☆ Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Flight Category Banner */}
        <View style={[styles.categoryBanner, { borderColor: categoryColor }]}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>{data.flightCategory}</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryDesc}>{categoryDesc}</Text>
            <Text style={styles.fetchedAt}>
              Updated: {new Date(data.fetchedAt).toUTCString()}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: "Temperature", value: data.metar.temperature !== null ? `${data.metar.temperature}°C` : "N/A", icon: "🌡️" },
            { label: "Dewpoint", value: data.metar.dewpoint !== null ? `${data.metar.dewpoint}°C` : "N/A", icon: "💧" },
            { label: "Wind", value: data.metar.windSpeed !== null ? `${data.metar.windDirection}° @ ${data.metar.windSpeed}kt` : "Calm", icon: "💨" },
            { label: "Visibility", value: data.metar.visibility !== null ? `${data.metar.visibility >= 9999 ? "10km+" : data.metar.visibility + "m"}` : "N/A", icon: "👁️" },
            { label: "Altimeter", value: data.metar.altimeter !== null ? `${data.metar.altimeter} hPa` : "N/A", icon: "⏱️" },
            { label: "Wind Gust", value: data.metar.windGust !== null ? `${data.metar.windGust}kt` : "None", icon: "🌬️" },
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
            { key: "metar", label: "METAR" },
            { key: "taf", label: "TAF" },
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

        {/* METAR Tab */}
        {activeTab === "metar" && (
          <View style={styles.tabContent}>
            <View style={styles.rawCard}>
              <Text style={styles.rawLabel}>RAW METAR</Text>
              <Text style={styles.rawText}>{data.metar.raw}</Text>
            </View>

            {Object.keys(data.metar.decoded).length > 0 && (
              <View style={styles.decodedCard}>
                <Text style={styles.cardTitle}>Decoded</Text>
                {Object.entries(data.metar.decoded).map(([key, value]: any) => (
                  value && typeof value === "string" && value.trim() ? (
                    <View key={key} style={styles.decodedRow}>
                      <Text style={styles.decodedKey}>
                        {key.replace(/_/g, " ").toUpperCase()}
                      </Text>
                      <Text style={styles.decodedValue}>{value}</Text>
                    </View>
                  ) : null
                ))}
              </View>
            )}

            {data.metar.clouds.length > 0 && (
              <View style={styles.decodedCard}>
                <Text style={styles.cardTitle}>Cloud Layers</Text>
                {data.metar.clouds.map((cloud: any, i: number) => (
                  <View key={i} style={styles.decodedRow}>
                    <Text style={styles.decodedKey}>{cloud.type}</Text>
                    <Text style={styles.decodedValue}>{cloud.altitude * 100} ft</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAF Tab */}
        {activeTab === "taf" && (
          <View style={styles.tabContent}>
            {data.taf ? (
              <>
                <View style={styles.rawCard}>
                  <Text style={styles.rawLabel}>RAW TAF</Text>
                  <Text style={styles.rawText}>{data.taf.raw}</Text>
                </View>

                <Text style={styles.cardTitle}>Forecast Periods</Text>
                {data.taf.forecast.map((period: any, index: number) => (
                  <View key={index} style={styles.forecastCard}>
                    <View style={styles.forecastHeader}>
                      <Text style={styles.forecastTime}>
                        {new Date(period.start).toUTCString().slice(0, 16)}
                      </Text>
                      <Text style={styles.forecastArrow}>→</Text>
                      <Text style={styles.forecastTime}>
                        {new Date(period.end).toUTCString().slice(0, 16)}
                      </Text>
                    </View>
                    {period.windSpeed && (
                      <Text style={styles.forecastDetail}>
                        💨 Wind: {period.windDirection}° @ {period.windSpeed}kt
                      </Text>
                    )}
                    {period.visibility && (
                      <Text style={styles.forecastDetail}>
                        👁️ Visibility: {period.visibility >= 9999 ? "10km+" : period.visibility + "m"}
                      </Text>
                    )}
                    {period.conditions.length > 0 && (
                      <Text style={styles.forecastDetail}>
                        🌧️ {period.conditions.join(", ")}
                      </Text>
                    )}
                    {period.clouds.length > 0 && (
                      <Text style={styles.forecastDetail}>
                        ☁️ {period.clouds.map((c: any) => `${c.type} ${c.altitude * 100}ft`).join(", ")}
                      </Text>
                    )}
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>No TAF Available</Text>
                <Text style={styles.emptySubtitle}>TAF not issued for this station</Text>
              </View>
            )}
          </View>
        )}

        {/* AI Tab */}
        {activeTab === "ai" && (
          <View style={styles.tabContent}>

            <View style={styles.aiSection}>
              <Text style={styles.aiSectionTitle}>🤖 AI Weather Briefing</Text>
              <Text style={styles.aiSectionSubtitle}>
                Professional briefing generated by AI for pilots and dispatchers
              </Text>

              {!aiBriefing && !loadingBriefing && (
                <TouchableOpacity style={styles.aiBtn} onPress={fetchAIBriefing}>
                  <Text style={styles.aiBtnText}>Generate Briefing</Text>
                </TouchableOpacity>
              )}

              {loadingBriefing && (
                <View style={styles.aiLoading}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.aiLoadingText}>Generating briefing...</Text>
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

            <View style={styles.aiSection}>
              <Text style={styles.aiSectionTitle}>✅ Go / No-Go Assessment</Text>
              <Text style={styles.aiSectionSubtitle}>
                AI safety assessment for VFR and IFR operations
              </Text>

              {!goNoGo && !loadingGoNoGo && (
                <TouchableOpacity style={styles.aiBtn} onPress={fetchGoNoGo}>
                  <Text style={styles.aiBtnText}>Get Assessment</Text>
                </TouchableOpacity>
              )}

              {loadingGoNoGo && (
                <View style={styles.aiLoading}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.aiLoadingText}>Analyzing conditions...</Text>
                </View>
              )}

              {goNoGo && (
                <View style={styles.goNoGoCard}>
                  <View style={styles.goNoGoHeader}>
                    <View style={[styles.verdictBadge, { backgroundColor: getVerdictColor(goNoGo.verdict) }]}>
                      <Text style={styles.verdictText}>{goNoGo.verdict}</Text>
                    </View>
                    <View style={[styles.riskBadge, { borderColor: getRiskColor(goNoGo.riskLevel) }]}>
                      <Text style={[styles.riskText, { color: getRiskColor(goNoGo.riskLevel) }]}>
                        {goNoGo.riskLevel} RISK
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.goNoGoSummary}>{goNoGo.briefingSummary}</Text>

                  <View style={styles.assessmentRow}>
                    <Text style={styles.assessmentLabel}>VFR:</Text>
                    <Text style={styles.assessmentValue}>{goNoGo.vfrAssessment}</Text>
                  </View>
                  <View style={styles.assessmentRow}>
                    <Text style={styles.assessmentLabel}>IFR:</Text>
                    <Text style={styles.assessmentValue}>{goNoGo.ifrAssessment}</Text>
                  </View>

                  {goNoGo.primaryHazards?.length > 0 && (
                    <View style={styles.hazardsSection}>
                      <Text style={styles.hazardsTitle}>⚠️ Primary Hazards</Text>
                      {goNoGo.primaryHazards.map((hazard: string, i: number) => (
                        <Text key={i} style={styles.hazardItem}>• {hazard}</Text>
                      ))}
                    </View>
                  )}

                  <View style={styles.recommendationBox}>
                    <Text style={styles.recommendationLabel}>Recommendation</Text>
                    <Text style={styles.recommendationText}>{goNoGo.recommendation}</Text>
                  </View>

                  <TouchableOpacity onPress={fetchGoNoGo} style={styles.refreshBtn}>
                    <Text style={styles.refreshBtnText}>↻ Refresh</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  icaoTitle: { fontSize: 36, fontWeight: "800", color: Colors.white },
  airportName: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  saveBtn: {
    backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 16,
    paddingVertical: 8, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  saveBtnSaved: { borderColor: Colors.warning, backgroundColor: Colors.backgroundSecondary },
  saveBtnText: { color: Colors.textPrimary, fontSize: 13, fontWeight: "600" },
  categoryBanner: {
    flexDirection: "row", alignItems: "center", marginHorizontal: 20,
    marginTop: 12, backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, padding: 12, gap: 12,
  },
  categoryBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  categoryText: { color: Colors.white, fontWeight: "800", fontSize: 16 },
  categoryInfo: { flex: 1 },
  categoryDesc: { color: Colors.textPrimary, fontSize: 13, fontWeight: "600" },
  fetchedAt: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  statsGrid: {
    flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20,
    marginTop: 16, gap: 10,
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
  tabText: { color: Colors.textMuted, fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: Colors.white },
  tabContent: { paddingHorizontal: 20, marginTop: 16, paddingBottom: 30 },
  rawCard: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: 12,
    padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  rawLabel: { color: Colors.primary, fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 1 },
  rawText: { color: Colors.textPrimary, fontSize: 13, fontFamily: "monospace", lineHeight: 20 },
  decodedCard: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  cardTitle: { color: Colors.textPrimary, fontWeight: "700", fontSize: 15, marginBottom: 12 },
  decodedRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  decodedKey: { color: Colors.textMuted, fontSize: 12, flex: 1 },
  decodedValue: { color: Colors.textPrimary, fontSize: 12, flex: 2, textAlign: "right" },
  forecastCard: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  forecastHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 4 },
  forecastTime: { color: Colors.primary, fontSize: 11, fontWeight: "600" },
  forecastArrow: { color: Colors.textMuted, fontSize: 12 },
  forecastDetail: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  aiSection: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorder,
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
  goNoGoCard: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  goNoGoHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  verdictBadge: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 6 },
  verdictText: { color: Colors.white, fontWeight: "800", fontSize: 16 },
  riskBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  riskText: { fontWeight: "700", fontSize: 13 },
  goNoGoSummary: { color: Colors.textPrimary, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  assessmentRow: { flexDirection: "row", marginBottom: 8, gap: 8 },
  assessmentLabel: { color: Colors.primary, fontWeight: "700", fontSize: 13, width: 35 },
  assessmentValue: { color: Colors.textSecondary, fontSize: 13, flex: 1 },
  hazardsSection: { marginTop: 12, marginBottom: 12 },
  hazardsTitle: { color: Colors.warning, fontWeight: "700", fontSize: 13, marginBottom: 6 },
  hazardItem: { color: Colors.textSecondary, fontSize: 13, marginBottom: 4 },
  recommendationBox: {
    backgroundColor: Colors.background, borderRadius: 8,
    padding: 12, marginTop: 8, marginBottom: 12,
  },
  recommendationLabel: { color: Colors.primary, fontWeight: "700", fontSize: 12, marginBottom: 4 },
  recommendationText: { color: Colors.textPrimary, fontSize: 13, lineHeight: 20 },
  refreshBtn: { alignItems: "center", paddingVertical: 8 },
  refreshBtnText: { color: Colors.primary, fontSize: 13 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 14, textAlign: "center", marginBottom: 24 },
  backBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: Colors.white, fontWeight: "700" },
});
