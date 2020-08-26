const express = require("express");
const router = express.Router();
const { clearDatabase, getAllUsers } = require("../controllers/admin.controller");


router.delete("/all", clearDatabase);
router.get("/users", getAllUsers);

module.exports = router;
