const express = require("express");

const router = express.Router();

const Svg = require("../models/Svg");

const {
  uploadSvg,
  getAllSvgs
} = require("../controllers/svgController");

// UPLOAD SVG
router.post(
  "/upload-svg",
  uploadSvg
);

// GET ALL SVGS
router.get(
  "/svgs",
  getAllSvgs
);

// GET LATEST SVG
router.get(
  "/latest-svg",
  async (req, res) => {

    try {

      const latestSvg =
        await Svg.findOne()
        .sort({
          createdAt: -1
        });

      res.json(latestSvg);

    } catch (error) {

      console.log(error);

      res.status(500).json({

        message: "Server Error"

      });

    }

  }
);

// RESET SVG TO ORIGINAL
router.post(
  "/reset-svg",
  async (req, res) => {

    try {

      const latestSvg =
        await Svg.findOne()
        .sort({
          createdAt: -1
        });

      if (!latestSvg) {

        return res.status(404).json({

          message: "SVG not found"

        });

      }

      latestSvg.currentSvg =
        latestSvg.originalSvg;

      await latestSvg.save();

      res.json({

        message: "SVG Reset Success"

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        message: "Server Error"

      });

    }

  }
);

module.exports = router;