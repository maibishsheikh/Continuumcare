const express = require("express");
const router = express.Router();
const controller = require("../controllers/test.controller");

router.get("/write", controller.testWrite);

module.exports = router;
