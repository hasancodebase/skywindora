import SavedLocation from "../models/SavedLocation.js";

// GET all saved locations for a device
export const getSavedLocations = async (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID is required" });
    }

    const locations = await SavedLocation.find({ deviceId })
      .sort({ lastAccessed: -1 })
      .limit(20);

    res.json(locations);

  } catch (err) {
    console.error("Get Saved Error:", err.message);
    res.status(500).json({ error: "Failed to get saved locations" });
  }
};

// POST save a location
export const saveLocation = async (req, res) => {
  try {
    const { deviceId, type, name, query, country, latitude, longitude } = req.body;

    if (!deviceId || !type || !name || !query) {
      return res.status(400).json({ error: "deviceId, type, name and query are required" });
    }

    const location = await SavedLocation.findOneAndUpdate(
      { deviceId, query: query.toUpperCase() },
      {
        deviceId,
        type,
        name,
        query: query.toUpperCase(),
        country: country || null,
        latitude: latitude || null,
        longitude: longitude || null,
        lastAccessed: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(201).json(location);

  } catch (err) {
    console.error("Save Location Error:", err.message);
    res.status(500).json({ error: "Failed to save location" });
  }
};

// DELETE a saved location
export const deleteSavedLocation = async (req, res) => {
  try {
    const { deviceId, query } = req.params;

    if (!deviceId || !query) {
      return res.status(400).json({ error: "Device ID and query are required" });
    }

    await SavedLocation.findOneAndDelete({
      deviceId,
      query: query.toUpperCase()
    });

    res.json({ message: "Location removed successfully" });

  } catch (err) {
    console.error("Delete Saved Error:", err.message);
    res.status(500).json({ error: "Failed to delete location" });
  }
};

// DELETE all saved locations for a device
export const clearSavedLocations = async (req, res) => {
  try {
    const { deviceId } = req.params;

    await SavedLocation.deleteMany({ deviceId });
    res.json({ message: "All saved locations cleared" });

  } catch (err) {
    console.error("Clear Saved Error:", err.message);
    res.status(500).json({ error: "Failed to clear locations" });
  }
};