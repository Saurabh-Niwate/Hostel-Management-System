const express = require("express");
const router = express.Router();
const {
  getDailyMenu,
  createMenuItem,
  updateMenuItem,
  getDinnerPolls,
  createDinnerPoll,
  closeDinnerPoll,
  getNightFoodOrders,
  updateNightFoodOrderStatus
} = require("../controllers/canteenOwnerController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

router.get("/menu", verifyToken, requireRole("Canteen Owner"), getDailyMenu);
router.post("/menu", verifyToken, requireRole("Canteen Owner"), createMenuItem);
router.put("/menu/:menuId", verifyToken, requireRole("Canteen Owner"), updateMenuItem);
router.get("/dinner-polls", verifyToken, requireRole("Canteen Owner"), getDinnerPolls);
router.post("/dinner-polls", verifyToken, requireRole("Canteen Owner"), createDinnerPoll);
router.put("/dinner-polls/:pollId/close", verifyToken, requireRole("Canteen Owner"), closeDinnerPoll);

router.get("/night-orders", verifyToken, requireRole("Canteen Owner"), getNightFoodOrders);
router.put("/night-orders/:orderId/status", verifyToken, requireRole("Canteen Owner"), updateNightFoodOrderStatus);

module.exports = router;
