const Svg = require("../models/Svg");

const { DOMParser } = require("xmldom");

const uploadSvg = async (req, res) => {

  try {

    const { svg } = req.body;

    if (!svg) {
      return res.status(400).json({
        message: "SVG is required"
      });
    }

    // Parse SVG
    const doc = new DOMParser().parseFromString(
      svg,
      "image/svg+xml"
    );

    const extractedElements = [];

    // TEXT extraction
    const texts = doc.getElementsByTagName("text");

    for (let i = 0; i < texts.length; i++) {

      const text = texts[i];

      extractedElements.push({
        type: "text",
        text: text.textContent,
        x: text.getAttribute("x"),
        y: text.getAttribute("y")
      });

    }

    // RECT extraction
    const rects = doc.getElementsByTagName("rect");

    for (let i = 0; i < rects.length; i++) {

      const rect = rects[i];

      extractedElements.push({
        type: "rect",
        x: rect.getAttribute("x"),
        y: rect.getAttribute("y"),
        width: rect.getAttribute("width"),
        height: rect.getAttribute("height")
      });

    }

    // Save in DB
    const newSvg = await Svg.create({
      originalSvg: svg,
      currentSvg: svg,
      elements: extractedElements
    });

    res.status(201).json({
      message: "SVG uploaded and parsed successfully",
      data: newSvg
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


const getAllSvgs = async (req, res) => {

  try {

    const svgs = await Svg.find().sort({
      createdAt: -1
    });

    res.status(200).json(svgs);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
module.exports = {
  uploadSvg,
  getAllSvgs
};