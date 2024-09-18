const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: { type: String, require: true, unique: true },
  serverId: { type: String, require: true },
  balance: { type: Number, default: 0 },
  dailyLastUsed: { type: Number, default: 0 },
  coinflipLastUsed: { type: Number, default: 0 },
  customRoleId: { type: String, default: "" },
});

const model = mongoose.model("droppersshopdb", profileSchema);

module.exports = model;
