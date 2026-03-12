import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Colors, FlightCategoryColors } from "../../constants/Colors";

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

export default function ResultsScreen({ route, navigation }: any) {
  const { results } = route.params || {};

  if (!results || results.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No Results</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Home")}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.backButton}>
            <Text style={styles.backArrow}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Search Results</Text>
          <Text style={styles.subtitle}>{results.length} location{results.length > 1 ? "s" : ""} found</Text>
        </View>

        {/* Results */}
        {results.map((item: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.resultCard}
            onPress={() => {
              if (item.type === "aviation") {
                navigation.navigate("Aviation", { data: item, query: item.airport.icao });
              } else {
                navigation.navigate("Weather", { data: item, query: item.location.city });
              }
            }}
          >
            {item.type === "aviation" ? (
              <View>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardIcon}>✈️</Text>
                    <View>
                      <Text style={styles.cardTitle}>{item.airport.icao}</Text>
                      <Text style={styles.cardSubtitle}>Aviation Weather</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: FlightCategoryColors[item.flightCategory as keyof typeof FlightCategoryColors] || Colors.unknown }
                  ]}>
                    <Text style={styles.categoryText}>{item.flightCategory}</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>🌡️</Text>
                    <Text style={styles.statValue}>{item.metar.temperature}°C</Text>
                    <Text style={styles.statLabel}>Temp</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>💨</Text>
                    <Text style={styles.statValue}>{item.metar.windSpeed}kt</Text>
                    <Text style={styles.statLabel}>Wind</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>👁️</Text>
                    <Text style={styles.statValue}>
                      {item.metar.visibility >= 9999 ? "10km+" : item.metar.visibility + "m"}
                    </Text>
                    <Text style={styles.statLabel}>Vis</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>⏱️</Text>
                    <Text style={styles.statValue}>{item.metar.altimeter}</Text>
                    <Text style={styles.statLabel}>QNH</Text>
                  </View>
                </View>

                <View style={styles.rawMetar}>
                  <Text style={styles.rawText}>{item.metar.raw}</Text>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardIcon}>
                      {getWeatherIcon(item.current.weatherCode)}
                    </Text>
                    <View>
                      <Text style={styles.cardTitle}>{item.location.city}</Text>
                      <Text style={styles.cardSubtitle}>{item.location.country}</Text>
                    </View>
                  </View>
                  <Text style={styles.bigTemp}>{item.current.temperature}°C</Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>💧</Text>
                    <Text style={styles.statValue}>{item.current.humidity}%</Text>
                    <Text style={styles.statLabel}>Humidity</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>💨</Text>
                    <Text style={styles.statValue}>{item.current.windSpeed}km/h</Text>
                    <Text style={styles.statLabel}>Wind</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>🌡️</Text>
                    <Text style={styles.statValue}>{item.current.feelsLike}°C</Text>
                    <Text style={styles.statLabel}>Feels</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>👁️</Text>
                    <Text style={styles.statValue}>
                      {(item.current.visibility / 1000).toFixed(1)}km
                    </Text>
                    <Text style={styles.statLabel}>Vis</Text>
                  </View>
                </View>

                <Text style={styles.condition}>{item.current.condition}</Text>
              </View>
            )}

            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Tap for full details →</Text>
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backButton: { marginBottom: 8 },
  backArrow: { color: Colors.primary, fontSize: 14 },
  title: { fontSize: 28, fontWeight: "800", color: Colors.white },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  resultCard: {
    backgroundColor: Colors.card, borderRadius: 16, marginHorizontal: 20,
    marginTop: 16, padding: 16, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIcon: { fontSize: 32 },
  cardTitle: { fontSize: 20, fontWeight: "800", color: Colors.white },
  cardSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  categoryBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  categoryText: { color: Colors.white, fontWeight: "800", fontSize: 14 },
  bigTemp: { fontSize: 36, fontWeight: "800", color: Colors.white },
  statsRow: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: Colors.backgroundSecondary, borderRadius: 12,
    padding: 12, marginBottom: 12,
  },
  statItem: { alignItems: "center", flex: 1 },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statValue: { color: Colors.textPrimary, fontWeight: "700", fontSize: 13 },
  statLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  rawMetar: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: 8,
    padding: 10, marginBottom: 8,
  },
  rawText: { color: Colors.primary, fontSize: 12, fontFamily: "monospace" },
  condition: { color: Colors.textSecondary, fontSize: 14, marginBottom: 8 },
  tapHint: { alignItems: "flex-end", marginTop: 4 },
  tapHintText: { color: Colors.primary, fontSize: 12 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: 24 },
  backBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: Colors.white, fontWeight: "700" },
});