const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// Helper function to get start and end dates for filters
const getStartAndEndDates = (filter) => {
  const now = new Date();
  let start, end;

  switch (filter) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setDate(start.getDate() + 1);
      break;
    case "yesterday":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      end = new Date(start);
      end.setDate(start.getDate() + 1);
      break;
    case "week":
      const day = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      end = new Date(start);
      end.setDate(start.getDate() + 7);
      break;
    case "last week":
      const lastWeekDay = now.getDay();
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - lastWeekDay);
      start = new Date(end);
      start.setDate(end.getDate() - 7);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case "last month":
      end = new Date(now.getFullYear(), now.getMonth(), 1);
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    case "last year":
      end = new Date(now.getFullYear(), 0, 1);
      start = new Date(now.getFullYear() - 1, 0, 1);
      break;
    default:
      start = new Date(0);
      end = new Date();
  }

  return { start, end };
};

// Sales Analytics API
router.get("/sales-analytics", async (req, res) => {
  const { filter } = req.query;

  if (!filter) {
    return res.status(400).json({ error: "Filter is required." });
  }

  const { start, end } = getStartAndEndDates(filter);

  try {
    let data = [];
    let totalAmount = 0;

    if (filter === "year" || filter === "last year") {
      // Group by month
      const aggregation = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            totalSales: { $sum: "$totalAmount" },
          },
        },
        { $sort: { "_id": 1 } },
      ]);
      data = aggregation.map((item) => ({
        name: new Date(0, item._id - 1).toLocaleString(undefined, { month: "short" }),
        Sales: item.totalSales,
      }));
      totalAmount = aggregation.reduce((sum, item) => sum + item.totalSales, 0);
    } else if (filter === "today" || filter === "yesterday") {
      // Single day
      const aggregation = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
          },
        },
      ]);
      totalAmount = aggregation.length > 0 ? aggregation[0].totalSales : 0;
      data = [
        {
          name: filter.charAt(0).toUpperCase() + filter.slice(1),
          Sales: totalAmount,
        },
      ];
    } else if (filter === "week" || filter === "last week") {
      // Group by day of week
      const aggregation = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            totalSales: { $sum: "$totalAmount" },
          },
        },
        { $sort: { "_id": 1 } },
      ]);
      // Fill missing days
      const startOfWeek = new Date(start);
      data = Array(7)
        .fill(0)
        .map((_, i) => {
          const day = new Date(startOfWeek);
          day.setDate(startOfWeek.getDate() + i);
          const dayStr = day.toISOString().slice(0, 10);
          const found = aggregation.find((a) => a._id === dayStr);
          return {
            name: day.toLocaleDateString(undefined, { weekday: "short" }),
            Sales: found ? found.totalSales : 0,
          };
        });
      totalAmount = data.reduce((sum, d) => sum + d.Sales, 0);
    } else if (filter === "month" || filter === "last month") {
      // Group by day of month
      const aggregation = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: { $dayOfMonth: "$createdAt" },
            totalSales: { $sum: "$totalAmount" },
          },
        },
        { $sort: { "_id": 1 } },
      ]);
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      data = Array(daysInMonth)
        .fill(0)
        .map((_, i) => {
          const found = aggregation.find((a) => a._id === i + 1);
          return {
            name: (i + 1).toString(),
            Sales: found ? found.totalSales : 0,
          };
        });
      totalAmount = data.reduce((sum, d) => sum + d.Sales, 0);
    }

    res.json({ data, totalAmount });
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
