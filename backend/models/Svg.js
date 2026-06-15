const mongoose = require("mongoose");

const svgSchema = new mongoose.Schema({

  originalSvg: {
    type: String,
    required: true
  },

  currentSvg: {
    type: String,
    required: true
  },

  elements: [
    {
      type: Object
    }
  ]

}, {
  timestamps: true
});

module.exports = mongoose.model("Svg", svgSchema);