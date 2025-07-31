import Favorite from "../models/favorite.schema.js";
// Create a new favorite
export const createFavorite = async (req, res) => {
  try {
    const { carId } = req.body;
    const customerId = req.customer?._id;

    if (!customerId)
      return res.status(401).json({ message: "🚫 Unauthorized" });

    if (!carId)
      return res.status(400).json({ message: "❌ carId is required" });

    const exists = await Favorite.findOne({ customerId, carId });
    if (exists)
      return res.status(409).json({ message: "❗ Car is already in favorites" });

    const favorite = await Favorite.create({ customerId, carId });

    res.status(201).json({
      message: "✅ Favorite added",
      data: favorite,
    });
  } catch (err) {
    console.error("❌ Error creating favorite:", err);
    res.status(500).json({ message: "🚫 Internal Server Error", error: err.message });
  }
};


// GET /customers/favourites
export const getFavorites = async (req, res) => {
  try {
    const customerId = req.customer?._id;
    const favorites = await Favorite.find({ customerId })
      .populate("carId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "✅ Favorites fetched",
      data: favorites,
    });
  } catch (err) {
    console.error("❌ Error fetching favorites:", err);
    res.status(500).json({ message: "🚫 Internal Server Error", error: err.message });
  }
};

// GET /customers/favourites/:carId → check 1 xe có trong fav không
export const checkFavorite = async (req, res) => {
  try {
    const { carId } = req.params;
    const customerId = req.customer?._id;

    const favorite = await Favorite.findOne({ customerId, carId });

    res.status(200).json({
      isFavorite: !!favorite,
    });
  } catch (err) {
    console.error("❌ Error checking favorite:", err);
    res.status(500).json({ message: "🚫 Internal Server Error", error: err.message });
  }
};

// DELETE /customers/favourites/:carId → xóa 1 xe khỏi fav
export const deleteFavorite = async (req, res) => {
  try {
    const { carId } = req.params;
    const customerId = req.customer?._id;

    const deleted = await Favorite.findOneAndDelete({ customerId, carId });

    if (!deleted)
      return res.status(404).json({ message: "❌ Favorite not found" });

    res.status(200).json({ message: "✅ Favorite deleted" });
  } catch (err) {
    console.error("❌ Error deleting favorite:", err);
    res.status(500).json({ message: "🚫 Internal Server Error", error: err.message });
  }
};

// DELETE /customers/favourites → xóa toàn bộ
export const deleteAllFavorites = async (req, res) => {
  try {
    const customerId = req.customer?._id;

    const result = await Favorite.deleteMany({ customerId });

    res.status(200).json({
      message: `✅ Deleted ${result.deletedCount} favorites`,
    });
  } catch (err) {
    console.error("❌ Error deleting all favorites:", err);
    res.status(500).json({ message: "🚫 Internal Server Error", error: err.message });
  }
};
