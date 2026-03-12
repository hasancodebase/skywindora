import axios from "axios";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 120 }); // 2 min cache

export const fetchRadarData = async () => {
  const cached = cache.get("radar");
  if (cached) return cached;

  const url = "https://api.rainviewer.com/public/weather-maps.json";
  const res = await axios.get(url);

  const radar = res.data.radar;
  const satellite = res.data.satellite;

  const data = {
    generatedAt: new Date().toISOString(),
    radar: {
      past: radar.past,
      nowcast: radar.nowcast,
      tileUrlTemplate:
        "https://tilecache.rainviewer.com/v2/radar/{time}/{size}/{z}/{x}/{y}/2/1_1.png",
    },
    satellite: {
      infrared: satellite.infrared,
      tileUrlTemplate:
        "https://tilecache.rainviewer.com/v2/satellite/{time}/{size}/{z}/{x}/{y}/0/0_0.png",
    },
  };

  cache.set("radar", data);
  return data;
};