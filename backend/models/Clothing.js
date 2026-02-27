const mongoose = require("mongoose");

const ClothingSchema = new mongoose.Schema({
    name: { type:String, required:true },
    category: String,
    color: String,
    season: String,
    occasion: String,
    image: String,
    wearCount: { type:Number, default:0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Clothing", ClothingSchema);