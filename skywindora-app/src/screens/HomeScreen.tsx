import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { Colors } from "../../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "https://skywindora-production.up.railway.app/api";
const { width } = Dimensions.get("window");

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
};

const getSkyCondition = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 7) return { label: "Dawn", icon: "🌅", color: "#f97316" };
  if (hour >= 7 && hour < 12) return { label: "Morning", icon: "☀️", color: "#fbbf24" };
  if (hour >= 12 && hour < 17) return { label: "Afternoon", icon: "🌤️", color: "#38bdf8" };
  if (hour >= 17 && hour < 19) return { label: "Dusk", icon: "🌇", color: "#f97316" };
  if (hour >= 19 && hour < 21) return { label: "Evening", icon: "🌆", color: "#8b5cf6" };
  return { label: "Night", icon: "🌙", color: "#1e293b" };
};

export default function HomeScreen({ navigation }: any) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationWeather, setLocationWeather] = useState<any>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadRecentSearches();
    fetchKarachiWeather();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Pulse animation for live indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchKarachiWeather = async () => {
    setLoadingLocation(true);
    try {
      const res = await axios.get(`${BASE_URL}/weather/Karachi`);
      setLocationWeather(res.data);
    } catch (err) {
      console.log("Location weather error:", err);
    } finally {
      setLoadingLocation(false);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem("recentSearches");
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (err) {
      console.log("Load recent error:", err);
    }
  };

  const saveRecentSearch = async (q: string) => {
    try {
      const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem("recentSearches", JSON.stringify(updated));
    } catch (err) {
      console.log("Save recent error:", err);
    }
  };

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim().toUpperCase();
    if (!q) {
      Alert.alert("Enter a search term", "Type a city name or ICAO code");
      return;
    }

    setLoading(true);

    try {
      const queries = q.split(/[\s,]+/).filter(Boolean);

      if (queries.length === 1) {
        const singleQ = queries[0];
        const isICAO = /^[A-Z]{4}$/.test(singleQ);
        await saveRecentSearch(singleQ);

        if (isICAO) {
          const res = await axios.get(`${BASE_URL}/aviation/${singleQ}`);
          navigation.navigate("Aviation", { data: res.data, query: singleQ });
        } else {
          const res = await axios.get(`${BASE_URL}/weather/${singleQ}`);
          navigation.navigate("Weather", { data: res.data, query: singleQ });
        }
      } else {
        const results: any[] = [];
        for (const singleQ of queries) {
          try {
            const isICAO = /^[A-Z]{4}$/.test(singleQ);
            await saveRecentSearch(singleQ);
            if (isICAO) {
              const res = await axios.get(`${BASE_URL}/aviation/${singleQ}`);
              results.push(res.data);
            } else {
              const res = await axios.get(`${BASE_URL}/weather/${singleQ}`);
              results.push(res.data);
            }
          } catch (err) {
            console.log("Failed for:", singleQ);
          }
        }
        if (results.length === 0) {
          Alert.alert("Not Found", "Could not find data for any of the searched locations.");
        } else {
          navigation.navigate("Results", { results });
        }
      }
    } catch (err: any) {
      Alert.alert(
        "Not Found",
        err?.response?.data?.error ||
          `Could not find data for "${q}".\n\nFor airports use ICAO code (e.g. OPKC, EGLL)\nFor cities type full city name (e.g. Karachi, London)`
      );
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  const clearRecentSearches = async () => {
    await AsyncStorage.removeItem("recentSearches");
    setRecentSearches([]);
  };

  const sky = getSkyCondition();
  const utcTime = currentTime.toUTCString().slice(17, 25);
  const localTime = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const localDate = currentTime.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.logo}>SkyWindora</Text>
              </View>
              <View style={styles.skyBadge}>
                <Text style={styles.skyIcon}>{sky.icon}</Text>
                <Text style={styles.skyLabel}>{sky.label}</Text>
              </View>
            </View>
            <Text style={styles.tagline}>Aviation & Global Weather Intelligence</Text>
          </View>

          {/* Time Card */}
          <View style={styles.timeCard}>
            <View style={styles.timeLeft}>
              <View style={styles.liveRow}>
                <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={styles.localTime}>{localTime}</Text>
              <Text style={styles.localDate}>{localDate}</Text>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeRight}>
              <Text style={styles.utcLabel}>UTC / ZULU</Text>
              <Text style={styles.utcTime}>{utcTime}Z</Text>
              <Text style={styles.utcSubtitle}>Aviation Standard Time</Text>
            </View>
          </View>

          {/* Location Weather Card */}
          {loadingLocation ? (
            <View style={styles.locationCard}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : locationWeather ? (
            <TouchableOpacity
              style={styles.locationCard}
              onPress={() => navigation.navigate("Weather", { data: locationWeather, query: "Karachi" })}
            >
              <View style={styles.locationCardHeader}>
                <View>
                  <Text style={styles.locationCardTitle}>📍 {locationWeather.location.city}</Text>
                  <Text style={styles.locationCardCountry}>{locationWeather.location.country}</Text>
                </View>
                <Text style={styles.locationCardTemp}>{locationWeather.current.temperature}°C</Text>
              </View>

              <View style={styles.locationCardStats}>
                <View style={styles.locationStat}>
                  <Text style={styles.locationStatIcon}>💧</Text>
                  <Text style={styles.locationStatValue}>{locationWeather.current.humidity}%</Text>
                  <Text style={styles.locationStatLabel}>Humidity</Text>
                </View>
                <View style={styles.locationStat}>
                  <Text style={styles.locationStatIcon}>💨</Text>
                  <Text style={styles.locationStatValue}>{locationWeather.current.windSpeed} km/h</Text>
                  <Text style={styles.locationStatLabel}>Wind</Text>
                </View>
                <View style={styles.locationStat}>
                  <Text style={styles.locationStatIcon}>🌅</Text>
                  <Text style={styles.locationStatValue}>{locationWeather.daily.sunrise[0]?.slice(11, 16)}</Text>
                  <Text style={styles.locationStatLabel}>Sunrise</Text>
                </View>
                <View style={styles.locationStat}>
                  <Text style={styles.locationStatIcon}>🌇</Text>
                  <Text style={styles.locationStatValue}>{locationWeather.daily.sunset[0]?.slice(11, 16)}</Text>
                  <Text style={styles.locationStatLabel}>Sunset</Text>
                </View>
              </View>

              <View style={styles.locationCardFooter}>
                <Text style={styles.locationCardCondition}>{locationWeather.current.condition}</Text>
                <Text style={styles.locationCardTap}>Tap for full forecast →</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Search Box */}
          <View style={styles.searchSection}>
            <Text style={styles.searchLabel}>🔍 Search Weather</Text>
            <View style={styles.searchContainer}>
              <View style={styles.searchBox}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="City or ICAO code (e.g. EGLL, London)"
                  placeholderTextColor={Colors.placeholder}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={() => handleSearch()}
                  autoCapitalize="characters"
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery("")}>
                    <Text style={styles.clearBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.searchBtn, loading && styles.searchBtnDisabled]}
                onPress={() => handleSearch()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.searchBtnText}>Go</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.hintRow}>
              <Text style={styles.hintText}>✈️ ICAO code for aviation</Text>
              <Text style={styles.hintSep}>·</Text>
              <Text style={styles.hintText}>🏙️ City name for weather</Text>
              <Text style={styles.hintSep}>·</Text>
              <Text style={styles.hintText}>🔀 Multiple with space</Text>
            </View>
          </View>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🕐 Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>Clear all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.recentChips}>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.recentChip}
                      onPress={() => handleSearch(search)}
                    >
                      <Text style={styles.recentChipIcon}>
                        {/^[A-Z]{4}$/.test(search) ? "✈️" : "🏙️"}
                      </Text>
                      <Text style={styles.recentChipText}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Flight Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📡 Flight Categories</Text>
            <View style={styles.categoryGrid}>
              {[
                { cat: "VFR", color: Colors.vfr, desc: "Ceiling >3000ft\nVis >5SM", icon: "🟢" },
                { cat: "MVFR", color: Colors.mvfr, desc: "Ceiling 1000-3000ft\nVis 3-5SM", icon: "🔵" },
                { cat: "IFR", color: Colors.ifr, desc: "Ceiling 500-1000ft\nVis 1-3SM", icon: "🔴" },
                { cat: "LIFR", color: Colors.lifr, desc: "Ceiling <500ft\nVis <1SM", icon: "🟣" },
              ].map((item) => (
                <View key={item.cat} style={[styles.categoryCard, { borderColor: item.color }]}>
                  <Text style={styles.categoryIcon}>{item.icon}</Text>
                  <Text style={[styles.categoryLabel, { color: item.color }]}>{item.cat}</Text>
                  <Text style={styles.categoryDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Aviation Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Quick Tips</Text>
            <View style={styles.tipsCard}>
              {[
                { icon: "✈️", tip: "Type 4-letter ICAO code for airport METAR/TAF" },
                { icon: "🏙️", tip: "Type city name for 7-day weather forecast" },
                { icon: "🤖", tip: "Use AI tab for Go/No-Go assessment" },
                { icon: "⭐", tip: "Save favorite airports for quick access" },
                { icon: "🔀", tip: "Search multiple locations separated by space" },
              ].map((item, index) => (
                <View key={index} style={styles.tipRow}>
                  <Text style={styles.tipIcon}>{item.icon}</Text>
                  <Text style={styles.tipText}>{item.tip}</Text>
                </View>
              ))}
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontSize: 13, color: Colors.textSecondary },
  logo: { fontSize: 32, fontWeight: "800", color: Colors.primary, letterSpacing: 1 },
  tagline: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  skyBadge: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 10,
    alignItems: "center", borderWidth: 1, borderColor: Colors.cardBorder,
  },
  skyIcon: { fontSize: 24 },
  skyLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  timeCard: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: Colors.card,
    borderRadius: 16, padding: 16, flexDirection: "row",
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  timeLeft: { flex: 1 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.vfr },
  liveText: { color: Colors.vfr, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  localTime: { fontSize: 28, fontWeight: "800", color: Colors.white },
  localDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  timeDivider: { width: 1, backgroundColor: Colors.cardBorder, marginHorizontal: 16 },
  timeRight: { flex: 1, justifyContent: "center" },
  utcLabel: { fontSize: 10, color: Colors.primary, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  utcTime: { fontSize: 24, fontWeight: "800", color: Colors.white },
  utcSubtitle: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  locationCard: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: Colors.card,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  locationCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  locationCardTitle: { fontSize: 16, fontWeight: "700", color: Colors.white },
  locationCardCountry: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  locationCardTemp: { fontSize: 40, fontWeight: "800", color: Colors.primary },
  locationCardStats: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  locationStat: { alignItems: "center" },
  locationStatIcon: { fontSize: 18, marginBottom: 2 },
  locationStatValue: { fontSize: 13, fontWeight: "700", color: Colors.textPrimary },
  locationStatLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  locationCardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  locationCardCondition: { color: Colors.textSecondary, fontSize: 13 },
  locationCardTap: { color: Colors.primary, fontSize: 12 },
  searchSection: { paddingHorizontal: 20, marginTop: 20 },
  searchLabel: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary, marginBottom: 10 },
  searchContainer: { flexDirection: "row", gap: 10 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.cardBorder, paddingHorizontal: 12, height: 50,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14, height: 50 },
  clearBtn: { color: Colors.textMuted, fontSize: 16, padding: 4 },
  searchBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 20, height: 50, justifyContent: "center", alignItems: "center",
  },
  searchBtnDisabled: { opacity: 0.6 },
  searchBtnText: { color: Colors.white, fontWeight: "800", fontSize: 16 },
  hintRow: { flexDirection: "row", alignItems: "center", marginTop: 8, flexWrap: "wrap", gap: 4 },
  hintText: { color: Colors.textMuted, fontSize: 11 },
  hintSep: { color: Colors.textMuted, fontSize: 11 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  clearText: { color: Colors.primary, fontSize: 13 },
  recentChips: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  recentChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.card, borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 8, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  recentChipIcon: { fontSize: 14 },
  recentChipText: { color: Colors.textPrimary, fontSize: 13, fontWeight: "600" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryCard: {
    backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1,
    padding: 14, width: "47%",
  },
  categoryIcon: { fontSize: 18, marginBottom: 6 },
  categoryLabel: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  categoryDesc: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  tipsCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 30,
  },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  tipIcon: { fontSize: 18, width: 24 },
  tipText: { color: Colors.textSecondary, fontSize: 13, flex: 1 },
});