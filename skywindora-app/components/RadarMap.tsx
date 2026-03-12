import { View, StyleSheet } from "react-native";
import MapView, { UrlTile } from "react-native-maps";

export default function RadarMap() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 25.2048,
          longitude: 55.2708,
          latitudeDelta: 20,
          longitudeDelta: 20,
        }}
      >
        <UrlTile
          urlTemplate="https://tilecache.rainviewer.com/v2/radar/nowcast/256/{z}/{x}/{y}/2/1_1.png"
          maximumZ={12}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
  },

  map: {
    flex: 1,
  },
});