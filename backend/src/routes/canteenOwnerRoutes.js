const express = require("express");
const router = express.Router();
const {
  getDailyMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getDinnerPolls,
  createDinnerPoll,
  updateDinnerPoll,
  deleteDinnerPoll,
  closeDinnerPoll
} = require("../controllers/canteenOwnerController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

router.get("/menu", verifyToken, requireRole("Canteen Owner"), getDailyMenu);
router.post("/menu", verifyToken, requireRole("Canteen Owner"), createMenuItem);
router.put("/menu/:menuId", verifyToken, requireRole("Canteen Owner"), updateMenuItem);
router.delete("/menu/:menuId", verifyToken, requireRole("Canteen Owner"), deleteMenuItem);
router.get("/dinner-polls", verifyToken, requireRole("Canteen Owner"), getDinnerPolls);
router.post("/dinner-polls", verifyToken, requireRole("Canteen Owner"), createDinnerPoll);
router.put("/dinner-polls/:pollId", verifyToken, requireRole("Canteen Owner"), updateDinnerPoll);
router.delete("/dinner-polls/:pollId", verifyToken, requireRole("Canteen Owner"), deleteDinnerPoll);
router.put("/dinner-polls/:pollId/close", verifyToken, requireRole("Canteen Owner"), closeDinnerPoll);

module.exports = router;
