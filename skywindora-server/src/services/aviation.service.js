import axios from "axios";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

export const fetchAviationWeather = async (icao) => {
  const cacheKey = `aviation_${icao.toUpperCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const headers = {
    Authorization: `BEARER ${process.env.AVWX_API_KEY}`,
  };

  // Fetch METAR and TAF in parallel
  const [metarRes, tafRes] = await Promise.allSettled([
    axios.get(`https://avwx.rest/api/metar/${icao}?options=translate&format=json`, { headers }),
    axios.get(`https://avwx.rest/api/taf/${icao}?options=translate&format=json`, { headers }),
  ]);

  if (metarRes.status === "rejected") {
    throw new Error(`ICAO ${icao} not found or AVWX error`);
  }

  const metar = metarRes.value.data;
  const taf = tafRes.status === "fulfilled" ? tafRes.value.data : null;

  // Determine flight category
  const flightCategory = metar.flight_rules || determineFlightCategory(
    metar.visibility?.value,
    metar.clouds
  );

  // Format METAR data
  const data = {
    type: "aviation",
    airport: {
      icao: icao.toUpperCase(),
      name: metar.station || icao.toUpperCase(),
      latitude: metar.lat || null,
      longitude: metar.lon || null,
      elevation: metar.elevation_m || null,
    },
    flightCategory,
    metar: {
      raw: metar.raw || "",
      time: metar.time?.dt || new Date().toISOString(),
      temperature: metar.temperature?.value ?? null,
      dewpoint: metar.dewpoint?.value ?? null,
      windDirection: metar.wind_direction?.value ?? null,
      windSpeed: metar.wind_speed?.value ?? null,
      windGust: metar.wind_gust?.value ?? null,
      visibility: metar.visibility?.value ?? null,
      altimeter: metar.altimeter?.value ?? null,
      clouds: metar.clouds?.map(c => ({
        type: c.type,
        altitude: c.altitude,
        modifier: c.modifier || null
      })) || [],
      conditions: metar.wx_codes?.map(w => w.value) || [],
      decoded: metar.translate || {},
    },
    taf: taf ? {
      raw: taf.raw || "",
      time: taf.time?.dt || null,
      forecast: taf.forecast?.map(f => ({
        start: f.start_time?.dt || null,
        end: f.end_time?.dt || null,
        windDirection: f.wind_direction?.value ?? null,
        windSpeed: f.wind_speed?.value ?? null,
        visibility: f.visibility?.value ?? null,
        clouds: f.clouds?.map(c => ({
          type: c.type,
          altitude: c.altitude
        })) || [],
        conditions: f.wx_codes?.map(w => w.value) || [],
      })) || []
    } : null,
    fetchedAt: new Date().toISOString()
  };

  cache.set(cacheKey, data);
  return data;
};

// Determine flight category from visibility and ceiling
const determineFlightCategory = (visibility, clouds) => {
  const ceiling = clouds?.find(c =>
    c.type === "BKN" || c.type === "OVC"
  )?.altitude || 9999;

  if (visibility === undefined || visibility === null) return "UNKNOWN";

  // Convert SM to meters if needed
  const visSM = visibility > 100 ? visibility / 1609 : visibility;

  if (visSM >= 5 && ceiling >= 3000) return "VFR";
  if (visSM >= 3 && ceiling >= 1000) return "MVFR";
  if (visSM >= 1 && ceiling >= 500) return "IFR";
  return "LIFR";
};