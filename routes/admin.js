const express = require("express");
const router = express.Router();
const { clearDatabase } = require("../controllers/admin.controller");


router.delete("/all", clearDatabase);

module.exports = router;
