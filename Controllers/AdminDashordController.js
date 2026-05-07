import { User } from "../models/User.js";
import { BinaryConfig } from "../models/adminBinaryPlanconfig.js";
import { UnilevelConfig } from "../models/AdminUnilevelPlanconfig.js";
import { MatrixConfig } from "../models/adminMatrixPlanconfig.js";
import { ROIConfig } from "../models/ROI.js";
import { RankPlan } from "../models/RankPlan.js";
import { RANK_PLANS } from "../Utils/RANK_PLANS.js";
import jwt from "jsonwebtoken";
import { Deposit } from "../models/deposit.js";
import { addTransaction } from "../Utils/wallet.js";
import { Withdrawal } from "../models/Withdrawal.js";
import { Commission } from "../models/commistion.js";
import { KYC } from "../models/KYC.js";
import { Transaction } from "../models/transection.js";
import { timeAgo } from "../Utils/timeago.js";
import ExcelJS from "exceljs";
import { IncomeConfig } from "../models/incomconfig.js";
import { Wallet } from "../models/wallet.js";






// ================= ADMIN DASHBOARD STATS ====================
export const getAdminDashboard = async (req, res) => {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfPrevMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );

    // 1. TOTAL USERS
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: firstDayOfMonth },
    });
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { $gte: firstDayOfPrevMonth, $lt: firstDayOfMonth },
    });
    const userGrowth =
      newUsersLastMonth > 0
        ? (
            ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) *
            100
          ).toFixed(0)
        : newUsersThisMonth > 0
          ? 100
          : 0;

    // 2. ACTIVE INVESTMENTS
    const activeInvestments = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: "$investment" } } },
    ]);
    const totalActiveInvestments = activeInvestments[0]?.total || 0;

    const prevMonthInvestments = await User.aggregate([
      { $match: { isActive: true, createdAt: { $lt: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: "$investment" } } },
    ]);
    const investmentGrowth =
      prevMonthInvestments[0]?.total > 0
        ? (
            ((totalActiveInvestments - (prevMonthInvestments[0]?.total || 0)) /
              (prevMonthInvestments[0]?.total || 1)) *
            100
          ).toFixed(0)
        : totalActiveInvestments > 0
          ? 100
          : 0;

    // 3. TOTAL COMMISSIONS
    const totalCommissions = await Commission.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalCommissionAmount = totalCommissions[0]?.total || 0;

    const prevMonthCommissions = await Commission.aggregate([
      { $match: { createdAt: { $lt: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const commissionGrowth =
      prevMonthCommissions[0]?.total > 0
        ? (
            ((totalCommissionAmount - (prevMonthCommissions[0]?.total || 0)) /
              (prevMonthCommissions[0]?.total || 1)) *
            100
          ).toFixed(0)
        : totalCommissionAmount > 0
          ? 100
          : 0;

    // 4. PENDING WITHDRAWALS
    const pendingWithdrawals = await Withdrawal.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalPendingWithdrawals = pendingWithdrawals[0]?.total || 0;

    const prevMonthPending = await Withdrawal.aggregate([
      { $match: { status: "pending", createdAt: { $lt: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const pendingGrowth =
      prevMonthPending[0]?.total > 0
        ? (
            ((totalPendingWithdrawals - (prevMonthPending[0]?.total || 0)) /
              (prevMonthPending[0]?.total || 1)) *
            100
          ).toFixed(0)
        : totalPendingWithdrawals > 0
          ? 100
          : 0;

    // 5. NEW REGISTRATIONS
    const newRegistrations = newUsersThisMonth;
    const registrationGrowth = userGrowth;

    // 6. SYSTEM REVENUE
    const totalDeposits = await Deposit.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalDepositAmount = totalDeposits[0]?.total || 0;

    const totalWithdrawn = await Withdrawal.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalWithdrawnAmount = totalWithdrawn[0]?.total || 0;

    const systemRevenue = totalDepositAmount - totalWithdrawnAmount;

    const prevMonthRevenue = await Deposit.aggregate([
      { $match: { status: "approved", createdAt: { $lt: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const prevRevenue =
      (prevMonthRevenue[0]?.total || 0) - (prevMonthPending[0]?.total || 0);
    const revenueGrowth =
      prevRevenue > 0
        ? (((systemRevenue - prevRevenue) / prevRevenue) * 100).toFixed(0)
        : systemRevenue > 0
          ? 100
          : 0;

    // ================== 7. RECENT ACTIVITIES ==================
    const recentActivities = await getRecentActivities();

    res.status(200).json({
      success: true,
      data: {
        totalUsers: {
          value: totalUsers,
          growth: `${userGrowth >= 0 ? "+" : ""}${userGrowth}%`,
        },
        activeInvestments: {
          value: totalActiveInvestments,
          growth: `${investmentGrowth >= 0 ? "+" : ""}${investmentGrowth}%`,
        },
        totalCommissions: {
          value: totalCommissionAmount,
          growth: `${commissionGrowth >= 0 ? "+" : ""}${commissionGrowth}%`,
        },
        pendingWithdrawals: {
          value: totalPendingWithdrawals,
          growth: `${pendingGrowth >= 0 ? "+" : ""}${pendingGrowth}%`,
        },
        newRegistrations: {
          value: newRegistrations,
          growth: `${registrationGrowth >= 0 ? "+" : ""}${registrationGrowth}%`,
        },
        systemRevenue: {
          value: systemRevenue,
          growth: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth}%`,
        },
        recentActivities: recentActivities,
      },
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET RECENT ACTIVITIES =================
async function getRecentActivities() {
  const activities = [];

  // 1. Recent User Registrations
  const recentUsers = await User.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .select("name email createdAt");

  recentUsers.forEach((user) => {
    activities.push({
      type: "REGISTRATION",
      title: "New user registered",
      description: `${user.name} (${user.email})`,
      time: user.createdAt,
    });
  });

  // 2. Recent User Logins
  const recentLogins = await User.find({ lastLogin: { $ne: null } })
    .sort({ lastLogin: -1 })
    .limit(20)
    .select("name email lastLogin");

  recentLogins.forEach((user) => {
    activities.push({
      type: "LOGIN",
      title: "User logged in",
      description: `${user.name} logged in`,
      time: user.lastLogin,
    });
  });

  // 3. Recent Investments (Commissions)
  const recentInvestments = await Commission.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("user", "name");

  recentInvestments.forEach((inv) => {
    activities.push({
      type: "INVESTMENT",
      title: "Investment made",
      description: `₹${inv.amount.toLocaleString()} by ${inv.user?.name || "Unknown"} (${inv.type})`,
      time: inv.createdAt,
    });
  });

  // 4. Recent Withdrawal Requests
  const recentWithdrawals = await Withdrawal.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("user", "name");

  recentWithdrawals.forEach((wd) => {
    activities.push({
      type: "WITHDRAWAL",
      title: "Withdrawal request",
      description: `₹${wd.amount.toLocaleString()} by ${wd.user?.name || "Unknown"} (${wd.status})`,
      time: wd.createdAt,
    });
  });

  // 5. KYC Approves/Rejects
  const kycActivities = await KYC.find({
    verifiedAt: { $ne: null },
  })
    .sort({ verifiedAt: -1 })
    .limit(20)
    .populate("userId", "name");

  kycActivities.forEach((kyc) => {
    activities.push({
      type: "KYC",
      title: `KYC ${kyc.kycStatus}`,
      description: `${kyc.userId?.name}'s KYC ${kyc.kycStatus}${kyc.adminRemark ? ` - Reason: ${kyc.adminRemark}` : ""}`,
      time: kyc.verifiedAt,
    });
  });

  // 6. Deposit Approves
  const approvedDeposits = await Deposit.find({
    status: "approved",
    approvedAt: { $ne: null },
  })
    .sort({ approvedAt: -1 })
    .limit(20)
    .populate("user", "name");

  approvedDeposits.forEach((dep) => {
    activities.push({
      type: "DEPOSIT",
      title: "Deposit approved",
      description: `₹${dep.amount.toLocaleString()} deposit approved for ${dep.user?.name}`,
      time: dep.approvedAt,
    });
  });

  // 7. Withdrawal Approves
  const approvedWithdrawals = await Withdrawal.find({
    status: "approved",
    processedAt: { $ne: null },
  })
    .sort({ processedAt: -1 })
    .limit(20)
    .populate("user", "name");

  approvedWithdrawals.forEach((wd) => {
    activities.push({
      type: "WITHDRAW_APPROVE",
      title: "Withdrawal approved",
      description: `₹${wd.amount.toLocaleString()} withdrawal approved for ${wd.user?.name}`,
      time: wd.processedAt,
    });
  });

  // 8. User Profile Updates
  const profileUpdates = await User.find({
    updatedAt: { $ne: null },
    $expr: { $ne: ["$createdAt", "$updatedAt"] },
  })
    .sort({ updatedAt: -1 })
    .limit(20)
    .select("name email updatedAt");

  profileUpdates.forEach((user) => {
    activities.push({
      type: "PROFILE_UPDATE",
      title: "Profile updated",
      description: `${user.name} updated their profile`,
      time: user.updatedAt,
    });
  });

  // 9. Block/Unblock Users
  const blockedUsers = await User.find({
    $or: [{ blockedAt: { $ne: null } }, { unblockedAt: { $ne: null } }],
  })
    .sort({ blockedAt: -1, unblockedAt: -1 })
    .limit(20)
    .select("name blockedAt unblockedAt isBlocked");

  blockedUsers.forEach((user) => {
    if (user.isBlocked && user.blockedAt) {
      activities.push({
        type: "USER_BLOCK",
        title: "User blocked",
        description: `${user.name} blocked by admin`,
        time: user.blockedAt,
      });
    } else if (!user.isBlocked && user.unblockedAt) {
      activities.push({
        type: "USER_UNBLOCK",
        title: "User unblocked",
        description: `${user.name} unblocked by admin`,
        time: user.unblockedAt,
      });
    }
  });

  // Sort all activities by time (newest first)
  activities.sort((a, b) => new Date(b.time) - new Date(a.time));

  // Return top 50 recent activities (sirf data)
  return activities.slice(0, 50).map((activity) => ({
    type: activity.type,
    title: activity.title,
    description: activity.description,
    time: activity.time,
  }));
}

// ===============================SystemReport================

export const getSystemReport = async (req, res) => {
  try {
    const { fromDate, toDate, format } = req.query;

    let dateFilter = {};
    if (fromDate && toDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        },
      };
    }

    // Get all reports
    const userReport = await getUserReport(dateFilter);
    const investmentReport = await getInvestmentReport(dateFilter);
    const commissionReport = await getCommissionReport(dateFilter);
    const withdrawalReport = await getWithdrawalReport(dateFilter);
    const financialSummary = await getFinancialSummary(dateFilter);
    const activeLogs = await getActiveLogs();

    const reportData = {
      userReport,
      investmentReport,
      commissionReport,
      withdrawalReport,
      financialSummary,
      activeLogs,
      generatedAt: new Date(),
      dateRange: { fromDate, toDate },
    };

    // ================= EXPORT TO EXCEL =================
    if (format === "excel") {
      return await exportSystemReportToExcel(reportData, res);
    }

    // ================= JSON RESPONSE (DEFAULT) =================
    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("System Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= EXPORT TO EXCEL (COMPLETE) =================
async function exportSystemReportToExcel(reportData, res) {
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = "MLM System";
  workbook.created = new Date();

  // ===== SHEET 1: USER REPORT =====
  const userSheet = workbook.addWorksheet("User Report");
  userSheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 25 },
  ];
  userSheet.getRow(1).font = { bold: true };
  userSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4472C4" },
  };
  userSheet.getRow(1).font = { color: { argb: "FFFFFF" } };

  userSheet.addRows([
    { metric: "Total Users", value: reportData.userReport.totalUsers },
    { metric: "Active Users", value: reportData.userReport.activeUsers },
    { metric: "Inactive Users", value: reportData.userReport.inactiveUsers },
    { metric: "New This Month", value: reportData.userReport.newThisMonth },
    { metric: "", value: "" },
    { metric: "User Growth Trend (Last 6 Months)", value: "" },
  ]);

  // Add growth trend rows
  reportData.userReport.userGrowthTrend?.forEach((trend) => {
    userSheet.addRow({
      metric: `  ${trend.month} ${trend.year}`,
      value: trend.count,
    });
  });

  // ===== SHEET 2: INVESTMENT REPORT =====
  const investmentSheet = workbook.addWorksheet("Investment Report");
  investmentSheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 25 },
  ];
  investmentSheet.getRow(1).font = { bold: true };
  investmentSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4472C4" },
  };
  investmentSheet.getRow(1).font = { color: { argb: "FFFFFF" } };

  investmentSheet.addRows([
    {
      metric: "Total Investment",
      value: `₹${reportData.investmentReport.totalInvestment?.toLocaleString() || 0}`,
    },
    {
      metric: "Active Plans",
      value: reportData.investmentReport.activePlans || 0,
    },
    {
      metric: "Average Investment",
      value: `₹${reportData.investmentReport.avgInvestment?.toLocaleString() || 0}`,
    },
    { metric: "", value: "" },
    { metric: "Investment by Plan", value: "" },
    {
      metric: "  Binary",
      value: `₹${reportData.investmentReport.investmentByPlan?.Binary?.toLocaleString() || 0}`,
    },
    {
      metric: "  Matrix",
      value: `₹${reportData.investmentReport.investmentByPlan?.Matrix?.toLocaleString() || 0}`,
    },
    {
      metric: "  Unilevel",
      value: `₹${reportData.investmentReport.investmentByPlan?.Unilevel?.toLocaleString() || 0}`,
    },
  ]);

  // ===== SHEET 3: COMMISSION REPORT =====
  const commissionSheet = workbook.addWorksheet("Commission Report");
  commissionSheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 25 },
  ];
  commissionSheet.getRow(1).font = { bold: true };
  commissionSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4472C4" },
  };
  commissionSheet.getRow(1).font = { color: { argb: "FFFFFF" } };

  commissionSheet.addRows([
    {
      metric: "Total Commission",
      value: `₹${reportData.commissionReport.totalCommission?.toLocaleString() || 0}`,
    },
    {
      metric: "Direct Commission",
      value: `₹${reportData.commissionReport.directCommission?.toLocaleString() || 0}`,
    },
    { metric: "", value: "" },
    { metric: "Commission Breakdown", value: "" },
    {
      metric: "  Level Commission",
      value: `₹${reportData.commissionReport.commissionBreakdown?.level?.toLocaleString() || 0}`,
    },
    {
      metric: "  Binary Commission",
      value: `₹${reportData.commissionReport.commissionBreakdown?.binary?.toLocaleString() || 0}`,
    },
    {
      metric: "  ROI Commission",
      value: `₹${reportData.commissionReport.commissionBreakdown?.roi?.toLocaleString() || 0}`,
    },
    {
      metric: "  Bonus Commission",
      value: `₹${reportData.commissionReport.commissionBreakdown?.bonus?.toLocaleString() || 0}`,
    },
  ]);

  // ===== SHEET 4: WITHDRAWAL REPORT =====
  const withdrawalSheet = workbook.addWorksheet("Withdrawal Report");
  withdrawalSheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 25 },
  ];
  withdrawalSheet.getRow(1).font = { bold: true };
  withdrawalSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4472C4" },
  };
  withdrawalSheet.getRow(1).font = { color: { argb: "FFFFFF" } };

  withdrawalSheet.addRows([
    {
      metric: "Pending Amount",
      value: `₹${reportData.withdrawalReport.pendingAmount?.toLocaleString() || 0}`,
    },
    {
      metric: "Approved Amount",
      value: `₹${reportData.withdrawalReport.approvedAmount?.toLocaleString() || 0}`,
    },
    {
      metric: "Rejected Amount",
      value: `₹${reportData.withdrawalReport.rejectedAmount?.toLocaleString() || 0}`,
    },
    {
      metric: "Total Tax Collected",
      value: `₹${reportData.withdrawalReport.totalTax?.toLocaleString() || 0}`,
    },
    { metric: "", value: "" },
    { metric: "Withdrawal Status", value: "" },
    {
      metric: "  Pending",
      value: reportData.withdrawalReport.withdrawalStatus?.pending || 0,
    },
    {
      metric: "  Approved",
      value: reportData.withdrawalReport.withdrawalStatus?.approved || 0,
    },
    {
      metric: "  Rejected",
      value: reportData.withdrawalReport.withdrawalStatus?.rejected || 0,
    },
  ]);

  // ===== SHEET 5: FINANCIAL SUMMARY =====
  const financialSheet = workbook.addWorksheet("Financial Summary");
  financialSheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 25 },
  ];
  financialSheet.getRow(1).font = { bold: true };
  financialSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4472C4" },
  };
  financialSheet.getRow(1).font = { color: { argb: "FFFFFF" } };

  financialSheet.addRows([
    {
      metric: "Total Revenue",
      value: `₹${reportData.financialSummary.totalRevenue?.toLocaleString() || 0}`,
    },
    {
      metric: "Total Commission Paid",
      value: `₹${reportData.financialSummary.totalCommissionPaid?.toLocaleString() || 0}`,
    },
    {
      metric: "Total Withdrawn",
      value: `₹${reportData.financialSummary.totalWithdrawn?.toLocaleString() || 0}`,
    },
    { metric: "", value: "" },
    {
      metric: "Net Profit",
      value: `₹${reportData.financialSummary.netProfit?.toLocaleString() || 0}`,
    },
  ]);

  // ===== SHEET 6: ACTIVE LOGS =====
  const logsSheet = workbook.addWorksheet("Active Logs");
  logsSheet.columns = [
    { header: "Type", key: "type", width: 15 },
    { header: "User", key: "user", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Action", key: "action", width: 30 },
    { header: "Details", key: "details", width: 40 },
    { header: "Time", key: "time", width: 20 },
  ];
  logsSheet.getRow(1).font = { bold: true };
  logsSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4472C4" },
  };
  logsSheet.getRow(1).font = { color: { argb: "FFFFFF" } };

  reportData.activeLogs?.forEach((log) => {
    logsSheet.addRow({
      type: log.type,
      user: log.user,
      email: log.email || "",
      action: log.action,
      details: log.details,
      time: log.time ? new Date(log.time).toLocaleString() : "",
    });
  });

  // Auto-fit columns
  [
    userSheet,
    investmentSheet,
    commissionSheet,
    withdrawalSheet,
    financialSheet,
    logsSheet,
  ].forEach((sheet) => {
    sheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const length = cell.value ? cell.value.toString().length : 0;
        if (length > maxLength) maxLength = length;
      });
      column.width = Math.min(maxLength + 2, 50);
    });
  });

  // Set response headers
  const fileName = `System_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

  await workbook.xlsx.write(res);
  res.end();
}

// ================= 1. USER REPORT =================
async function getUserReport(dateFilter) {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const newThisMonth = await User.countDocuments({
    createdAt: { $gte: firstDayOfMonth },
  });

  const growthTrend = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
    const count = await User.countDocuments({
      createdAt: { $gte: monthStart, $lte: monthEnd },
    });
    growthTrend.push({
      month: monthStart.toLocaleString("default", { month: "short" }),
      year: monthStart.getFullYear(),
      count,
    });
  }

  return {
    totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    newThisMonth,
    userGrowthTrend: growthTrend,
  };
}

// ================= 2. INVESTMENT REPORT =================
async function getInvestmentReport(dateFilter) {
  const investments = await User.aggregate([
    { $group: { _id: null, total: { $sum: "$investment" } } },
  ]);
  const totalInvestment = investments[0]?.total || 0;

  const usersWithPlans = await User.find({ "plans.0": { $exists: true } });
  let activePlans = 0;
  usersWithPlans.forEach((user) => {
    activePlans += user.plans?.length || 0;
  });

  const usersWithInvestment = await User.find({ investment: { $gt: 0 } });
  const avgInvestment =
    usersWithInvestment.length > 0
      ? totalInvestment / usersWithInvestment.length
      : 0;

  const today = new Date();
  const investmentTrend = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
    const usersInMonth = await User.find({
      createdAt: { $gte: monthStart, $lte: monthEnd },
    });
    const totalInv = usersInMonth.reduce(
      (sum, u) => sum + (u.investment || 0),
      0,
    );
    investmentTrend.push({
      month: monthStart.toLocaleString("default", { month: "short" }),
      year: monthStart.getFullYear(),
      amount: totalInv,
    });
  }

  const investmentByPlan = { Binary: 0, Matrix: 0, Unilevel: 0 };
  allUsers = await User.find({ "plans.0": { $exists: true } });
  allUsers.forEach((user) => {
    user.plans?.forEach((plan) => {
      if (investmentByPlan[plan.name] !== undefined) {
        investmentByPlan[plan.name] += plan.amount || 0;
      }
    });
  });

  return {
    totalInvestment,
    activePlans,
    avgInvestment: Math.round(avgInvestment),
    investmentTrend,
    investmentByPlan,
  };
}

// ================= 3. COMMISSION REPORT =================
async function getCommissionReport(dateFilter) {
  const allCommissions = await Commission.find({});
  const totalCommission = allCommissions.reduce(
    (sum, c) => sum + (c.amount || 0),
    0,
  );
  const directCommission = allCommissions
    .filter((c) => c.type === "direct")
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const levelWiseCommission = {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0,
    level6: 0,
  };
  allCommissions.forEach((c) => {
    if (c.type === "level" && c.level) {
      const key = `level${c.level}`;
      if (levelWiseCommission[key] !== undefined) {
        levelWiseCommission[key] += c.amount || 0;
      }
    }
  });

  const commissionBreakdown = {
    direct: directCommission,
    level: allCommissions
      .filter((c) => c.type === "level")
      .reduce((sum, c) => sum + (c.amount || 0), 0),
    binary: allCommissions
      .filter((c) => c.type === "binary")
      .reduce((sum, c) => sum + (c.amount || 0), 0),
    roi: allCommissions
      .filter((c) => c.type === "roi")
      .reduce((sum, c) => sum + (c.amount || 0), 0),
    bonus: allCommissions
      .filter((c) => c.type === "bonus")
      .reduce((sum, c) => sum + (c.amount || 0), 0),
  };

  const commissionByPlan = {
    Binary: allCommissions
      .filter((c) => c.plan === "Binary")
      .reduce((sum, c) => sum + (c.amount || 0), 0),
    Matrix: allCommissions
      .filter((c) => c.plan === "Matrix")
      .reduce((sum, c) => sum + (c.amount || 0), 0),
    Unilevel: allCommissions
      .filter((c) => c.plan === "Unilevel")
      .reduce((sum, c) => sum + (c.amount || 0), 0),
  };

  return {
    totalCommission,
    directCommission,
    levelWiseCommission,
    commissionBreakdown,
    commissionByPlan,
    totalCommissionCount: allCommissions.length,
  };
}

// ================= 4. WITHDRAWAL REPORT =================
async function getWithdrawalReport(dateFilter) {
  const allWithdrawals = await Withdrawal.find({});

  const pendingAmount = allWithdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + (w.amount || 0), 0);
  const approvedAmount = allWithdrawals
    .filter((w) => w.status === "approved")
    .reduce((sum, w) => sum + (w.amount || 0), 0);
  const rejectedAmount = allWithdrawals
    .filter((w) => w.status === "rejected")
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  const withdrawalStatus = {
    pending: allWithdrawals.filter((w) => w.status === "pending").length,
    approved: allWithdrawals.filter((w) => w.status === "approved").length,
    rejected: allWithdrawals.filter((w) => w.status === "rejected").length,
  };

  const totalTax = allWithdrawals.reduce(
    (sum, w) => sum + (w.taxAmount || 0),
    0,
  );

  const withdrawalByMethod = {
    bank: allWithdrawals
      .filter((w) => w.method === "bank")
      .reduce((sum, w) => sum + (w.amount || 0), 0),
    upi: allWithdrawals
      .filter((w) => w.method === "upi")
      .reduce((sum, w) => sum + (w.amount || 0), 0),
    crypto: allWithdrawals
      .filter((w) => w.method === "crypto")
      .reduce((sum, w) => sum + (w.amount || 0), 0),
  };

  return {
    pendingAmount,
    approvedAmount,
    rejectedAmount,
    totalTax,
    withdrawalStatus,
    withdrawalByMethod,
    totalWithdrawalCount: allWithdrawals.length,
  };
}

// ================= 5. FINANCIAL SUMMARY =================
async function getFinancialSummary(dateFilter) {
  const totalDeposits = await Deposit.aggregate([
    { $match: { status: "approved" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalRevenue = totalDeposits[0]?.total || 0;

  const totalCommission = await Commission.aggregate([
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalCommissionPaid = totalCommission[0]?.total || 0;

  const totalWithdrawn = await Withdrawal.aggregate([
    { $match: { status: "approved" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalWithdrawnAmount = totalWithdrawn[0]?.total || 0;

  const netProfit = totalRevenue - totalCommissionPaid - totalWithdrawnAmount;

  const today = new Date();
  const financialOverview = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

    const deposits = await Deposit.aggregate([
      {
        $match: {
          status: "approved",
          createdAt: { $gte: monthStart, $lte: monthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const commissions = await Commission.aggregate([
      { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    financialOverview.push({
      month: monthStart.toLocaleString("default", { month: "short" }),
      year: monthStart.getFullYear(),
      revenue: deposits[0]?.total || 0,
      commission: commissions[0]?.total || 0,
      profit: (deposits[0]?.total || 0) - (commissions[0]?.total || 0),
    });
  }

  return {
    totalRevenue,
    totalCommissionPaid,
    totalWithdrawn: totalWithdrawnAmount,
    netProfit,
    financialOverview,
  };
}

// ================= 6. ACTIVE LOGS =================
async function getActiveLogs() {
  const recentTransactions = await Transaction.find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("user", "name email");

  const recentCommissions = await Commission.find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("user", "name email")
    .populate("fromUser", "name");

  const recentWithdrawals = await Withdrawal.find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("user", "name email");

  const recentRegistrations = await User.find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .select("name email createdAt");

  const logs = [];

  recentRegistrations.forEach((user) => {
    logs.push({
      type: "REGISTRATION",
      user: user.name,
      email: user.email,
      action: "New user registered",
      time: user.createdAt,
      timeAgo: timeAgo(user.createdAt),
      details: `User ${user.name} joined the platform`,
    });
  });

  recentTransactions.forEach((tx) => {
    logs.push({
      type: "TRANSACTION",
      user: tx.user?.name || "Unknown",
      email: tx.user?.email || "",
      action: `${tx.type === "credit" ? "Received" : "Sent"} ${tx.walletType} wallet`,
      time: tx.createdAt,
      timeAgo: timeAgo(tx.createdAt),
      details: `${tx.description} - ₹${tx.amount}`,
    });
  });

  recentCommissions.forEach((com) => {
    logs.push({
      type: "COMMISSION",
      user: com.user?.name || "Unknown",
      email: com.user?.email || "",
      action: `Earned ${com.type} commission`,
      time: com.createdAt,
      timeAgo: timeAgo(com.createdAt),
      details: `₹${com.amount} from ${com.fromUser?.name || "System"}`,
    });
  });

  recentWithdrawals.forEach((wd) => {
    logs.push({
      type: "WITHDRAWAL",
      user: wd.user?.name || "Unknown",
      email: wd.user?.email || "",
      action: `Withdrawal request ${wd.status}`,
      time: wd.createdAt,
      timeAgo: timeAgo(wd.createdAt),
      details: `₹${wd.amount} via ${wd.method} - ${wd.status}`,
    });
  });

  logs.sort((a, b) => new Date(b.time) - new Date(a.time));

  return logs.slice(0, 100);
}

//=========================================UserManagement==================================

export const getAllUsers = async (req, res) => {
  try {
    const { search, status, kycStatus, rank, page = 1, limit = 20 } = req.query;

    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      if (status === "active") filter.isActive = true;
      if (status === "pending") filter.isActive = false;
      if (status === "rejected") filter.isActive = false;
    }

    if (rank) {
      filter.rank = rank;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);

    // Get KYC status for each user
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const kyc = await KYC.findOne({ userId: user._id });

        // Get total investment from plans
        const totalInvestment =
          user.plans?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: kyc?.phoneNumber || "",
          joinDate: user.createdAt,
          status: user.isActive ? "active" : "pending",
          kycStatus: kyc?.kycStatus || "pending",
          rank: user.rank || "Bronze",
          investment: totalInvestment,
          referral: user.referral,
          totalEarned: user.totalEarned || 0,
          wallet: user.wallet || 0,
        };
      }),
    );

    // Stats summary
    const totalActiveUsers = await User.countDocuments({ isActive: true });
    const totalPendingUsers = await User.countDocuments({ isActive: false });
    const totalKycApproved = await KYC.countDocuments({
      kycStatus: "Approved",
    });
    const totalKycPending = await KYC.countDocuments({ kycStatus: "Pending" });
    const totalKycRejected = await KYC.countDocuments({
      kycStatus: "Rejected",
    });

    const rankStats = await User.aggregate([
      { $group: { _id: "$rank", count: { $sum: 1 } } },
    ]);
    const rankCounts = {
      Bronze: 0,
      Silver: 0,
      Gold: 0,
      Platinum: 0,
      Diamond: 0,
      VIP: 0,
    };
    rankStats.forEach((r) => {
      if (rankCounts[r._id] !== undefined) rankCounts[r._id] = r.count;
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalActiveUsers,
        totalPendingUsers,
        totalKycApproved,
        totalKycPending,
        totalKycRejected,
        rankDistribution: rankCounts,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        limit: parseInt(limit),
      },
      users: usersWithDetails,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= A USER OVERALL DETAILS =================
export const getUserOverallDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // KYC Details
    const kyc = await KYC.findOne({ userId });

    // Total Investment
    const totalInvestment =
      user.plans?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Total Commission Earned
    const totalCommission = await Commission.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Total Deposit
    const totalDeposit = await Deposit.aggregate([
      { $match: { user: user._id, status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Total Withdrawal
    const totalWithdrawal = await Withdrawal.aggregate([
      { $match: { user: user._id, status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Recent Transactions (last 10)
    const recentTransactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent Commissions (last 10)
    const recentCommissions = await Commission.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("fromUser", "name");

    // Downline Count
    const downlineCount = await User.countDocuments({
      parentUnilevel: user._id,
    });

    // Plans purchased
    const plans = user.plans || [];

    res.status(200).json({
      success: true,
      data: {
        // Basic Info
        basicInfo: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: kyc?.phoneNumber || "",
          referral: user.referral,
          joinDate: user.createdAt,
          status: user.isActive ? "Active" : "Inactive",
          isBlocked: user.isBlocked || false,
          rank: user.rank || "Bronze",
        },

        // KYC Info
        kycInfo: {
          status: kyc?.kycStatus || "Not Submitted",
          submittedAt: kyc?.createdAt || null,
          verifiedAt: kyc?.verifiedAt || null,
          adminRemark: kyc?.adminRemark || "",
          idType: kyc?.idType || "",
          idNumber: kyc?.idNumber || "",
        },

        // Financial Summary
        financialSummary: {
          totalInvestment: totalInvestment,
          totalDeposit: totalDeposit[0]?.total || 0,
          totalWithdrawal: totalWithdrawal[0]?.total || 0,
          totalCommissionEarned: totalCommission[0]?.total || 0,
          currentWalletBalance: user.wallet || 0,
          totalEarned: user.totalEarned || 0,
        },

        // Plans
        plans: plans.map((p) => ({
          name: p.name,
          amount: p.amount,
          purchaseDate: p.purchaseDate,
          status: p.status || "active",
        })),

        // Referral Stats
        referralStats: {
          totalReferrals:
            (user.activeReferralCount || 0) + (user.pendingReferralCount || 0),
          activeReferrals: user.activeReferralCount || 0,
          pendingReferrals: user.pendingReferralCount || 0,
          downlineCount: downlineCount,
          totalReferralEarnings: user.totalReferralEarnings || 0,
        },

        // Recent Transactions (last 10)
        recentTransactions: recentTransactions.map((t) => ({
          type: t.type,
          walletType: t.walletType,
          amount: t.amount,
          description: t.description,
          status: t.status,
          date: t.createdAt,
        })),

        // Recent Commissions (last 10)
        recentCommissions: recentCommissions.map((c) => ({
          type: c.type,
          amount: c.amount,
          fromUser: c.fromUser?.name || "System",
          plan: c.plan,
          level: c.level,
          date: c.createdAt,
        })),

        // Account Timeline
        accountTimeline: {
          registeredAt: user.createdAt,
          lastActive: user.updatedAt,
          kycSubmittedAt: kyc?.createdAt || null,
          kycVerifiedAt: kyc?.verifiedAt || null,
          firstInvestment: plans[0]?.purchaseDate || null,
          lastInvestment: plans[plans.length - 1]?.purchaseDate || null,
        },
      },
    });
  } catch (error) {
    console.error("Get User Overall Details Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= CHECK USER LOGIN STATUS ===================================
export const checkUserLogin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if user has valid token
    let isLoggedIn = false;

    if (user.token && user.token !== "") {
      try {
        jwt.verify(user.token, process.env.JWT_SECRET);
        isLoggedIn = true;
      } catch (err) {
        isLoggedIn = false;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        isLoggedIn: isLoggedIn,
        status: isLoggedIn ? "Online" : "Offline",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//==============================DOWN LINE MANAGEMENT===============================

export const getUserDownlineManagement = async (req, res) => {
  try {
    const { search, level = 5 } = req.query;

    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Search query required (name/email/rank)",
      });
    }

    // Search user by name, email, or rank
    const user = await User.findOne({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { rank: { $regex: search, $options: "i" } },
      ],
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Calculate total investment
    const totalInvestment =
      user.plans?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Get direct downline count
    const directDownline = await User.countDocuments({
      parentUnilevel: user._id,
    });

    // Get total downline count (all trees)
    const binaryDownline = await User.countDocuments({ parent: user._id });
    const matrixDownline = await User.countDocuments({
      parentMatrix: user._id,
    });
    const unilevelDownline = await User.countDocuments({
      parentUnilevel: user._id,
    });
    const totalDownline = binaryDownline + matrixDownline + unilevelDownline;

    // Get complete downline structure
    const downlineStructure = await getCompleteDownline(
      user._id,
      parseInt(level),
    );

    res.status(200).json({
      success: true,
      data: {
        // User Details
        userDetails: {
          id: user._id,
          name: user.name,
          email: user.email,
          rank: user.rank || "Bronze",
          level: user.rank || "Bronze",
          directDownline: directDownline,
          totalDownline: totalDownline,
          totalInvestment: totalInvestment,
          isActive: user.isActive,
          joinDate: user.createdAt,
        },
        // Downline Structure
        downlineStructure: downlineStructure,
      },
    });
  } catch (error) {
    console.error("Downline Management Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET COMPLETE DOWNLINE STRUCTURE =================
async function getCompleteDownline(userId, maxLevel) {
  const result = {
    binary: [],
    matrix: [],
    unilevel: [],
  };

  // Binary downline
  const binaryQueue = [{ id: userId, level: 0 }];
  while (binaryQueue.length) {
    const { id, level } = binaryQueue.shift();
    if (level >= maxLevel) continue;

    const user = await User.findById(id).select(
      "_id name email rank isActive left right",
    );
    if (!user) continue;

    if (user.left) {
      const leftUser = await User.findById(user.left).select(
        "_id name email rank isActive",
      );
      if (leftUser) {
        result.binary.push({
          id: leftUser._id,
          name: leftUser.name,
          email: leftUser.email,
          rank: leftUser.rank,
          isActive: leftUser.isActive,
          level: level + 1,
          position: "left",
        });
        binaryQueue.push({ id: user.left, level: level + 1 });
      }
    }

    if (user.right) {
      const rightUser = await User.findById(user.right).select(
        "_id name email rank isActive",
      );
      if (rightUser) {
        result.binary.push({
          id: rightUser._id,
          name: rightUser.name,
          email: rightUser.email,
          rank: rightUser.rank,
          isActive: rightUser.isActive,
          level: level + 1,
          position: "right",
        });
        binaryQueue.push({ id: user.right, level: level + 1 });
      }
    }
  }

  // Matrix downline
  const matrixQueue = [{ id: userId, level: 0 }];
  while (matrixQueue.length) {
    const { id, level } = matrixQueue.shift();
    if (level >= maxLevel) continue;

    const user = await User.findById(id).select(
      "_id name email rank isActive leftMatrix middleMatrix rightMatrix",
    );
    if (!user) continue;

    const positions = [
      { id: user.leftMatrix, pos: "left" },
      { id: user.middleMatrix, pos: "middle" },
      { id: user.rightMatrix, pos: "right" },
    ];

    for (const pos of positions) {
      if (pos.id) {
        const childUser = await User.findById(pos.id).select(
          "_id name email rank isActive",
        );
        if (childUser) {
          result.matrix.push({
            id: childUser._id,
            name: childUser.name,
            email: childUser.email,
            rank: childUser.rank,
            isActive: childUser.isActive,
            level: level + 1,
            position: pos.pos,
          });
          matrixQueue.push({ id: pos.id, level: level + 1 });
        }
      }
    }
  }

  // Unilevel downline
  const unilevelQueue = [{ id: userId, level: 0 }];
  while (unilevelQueue.length) {
    const { id, level } = unilevelQueue.shift();
    if (level >= maxLevel) continue;

    const user = await User.findById(id).select(
      "_id name email rank isActive childrenUni",
    );
    if (!user) continue;

    for (const childId of user.childrenUni || []) {
      const childUser = await User.findById(childId).select(
        "_id name email rank isActive",
      );
      if (childUser) {
        result.unilevel.push({
          id: childUser._id,
          name: childUser.name,
          email: childUser.email,
          rank: childUser.rank,
          isActive: childUser.isActive,
          level: level + 1,
          position: "direct",
        });
        unilevelQueue.push({ id: childId, level: level + 1 });
      }
    }
  }

  return result;
}

//==============================referral Management==================================

// =================  GET ALL REFERRALS HISTORY  =================
export const getAllReferralsHistory = async (req, res) => {
  try {
    const { search, status } = req.query;

    const users = await User.find({}).select(
      "_id name email referral referredUsers totalReferralEarnings",
    );

    let allReferrals = [];

    for (const user of users) {
      const referrals = user.referredUsers || [];

      for (const ref of referrals) {
        const referredUser = await User.findById(ref.user).select(
          "_id name email rank isActive createdAt",
        );
        if (!referredUser) continue;

        const bonusAmount = (ref.amountInvested * 5) / 100;

        allReferrals.push({
          id: ref._id,
          userId: user._id,
          referrerName: user.name,
          referrerEmail: user.email,
          referralCode: user.referral,
          referredName: referredUser.name,
          referredEmail: referredUser.email,
          referredRank: referredUser.rank,
          investment: ref.amountInvested || 0,
          bonus: bonusAmount,
          date: ref.investedAt || ref.createdAt,
          status: ref.hasInvested ? "approved" : "pending",
        });
      }
    }

    // Search filter
    if (search) {
      allReferrals = allReferrals.filter(
        (r) =>
          r.referrerName.toLowerCase().includes(search.toLowerCase()) ||
          r.referrerEmail.toLowerCase().includes(search.toLowerCase()) ||
          r.referredName.toLowerCase().includes(search.toLowerCase()) ||
          r.referredEmail.toLowerCase().includes(search.toLowerCase()) ||
          r.referralCode.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Status filter
    if (status === "approved") {
      allReferrals = allReferrals.filter((r) => r.status === "approved");
    } else if (status === "pending") {
      allReferrals = allReferrals.filter((r) => r.status === "pending");
    }

    const stats = {
      totalReferrals: allReferrals.length,
      totalApproved: allReferrals.filter((r) => r.status === "approved").length,
      totalPending: allReferrals.filter((r) => r.status === "pending").length,
      totalBonus: allReferrals.reduce((sum, r) => sum + r.bonus, 0),
    };

    res.status(200).json({
      success: true,
      stats: stats,
      referrals: allReferrals,
    });
  } catch (error) {
    console.error("Get All Referrals Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET REFERRAL DETAILS BY USER ID =================
export const getReferralDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get the user (referrer)
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const referrals = user.referredUsers || [];

    if (referrals.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No referrals found for this user",
        data: {
          referrer: {
            name: user.name,
            email: user.email,
          },
          referrals: [],
        },
      });
    }

    // Get all referral details
    const referralDetailsList = await Promise.all(
      referrals.map(async (ref) => {
        const referredUser = await User.findById(ref.user).select(
          "_id name email rank",
        );
        if (!referredUser) return null;

        // Calculate level (you can implement level logic here)
        let level = "Direct";
        // If you have level tracking, you can calculate like this:
        // level = await getReferralLevel(user._id, referredUser._id);

        const bonusAmount = (ref.amountInvested * 5) / 100;

        return {
          referredUser: {
            name: referredUser.name,
            email: referredUser.email,
          },
          referralDetails: {
            referralCode: user.referral,
            level: level,
            investment: ref.amountInvested || 0,
            bonus: bonusAmount,
            date: ref.investedAt || ref.createdAt,
            status: ref.hasInvested ? "approved" : "pending",
          },
        };
      }),
    );

    // Filter out null values
    const validReferrals = referralDetailsList.filter((r) => r !== null);

    res.status(200).json({
      success: true,
      data: {
        referrer: {
          name: user.name,
          email: user.email,
        },
        referrals: validReferrals,
      },
    });
  } catch (error) {
    console.error("Get Referral Details Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//=================================== plan config ======================

export const getBinaryConfig = async (req, res) => {
  try {
    let config = await BinaryConfig.findOne();

    if (!config) {
      config = await BinaryConfig.create({
        pairValue: 100,
        leftRightRatio: "1:1",
        carryForward: true,
        dailyCapping: 5000,
        weeklyCapping: 25000,
        flushOut: false,
      });
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET UNILEVEL CONFIG =================
export const getUnilevelConfig = async (req, res) => {
  try {
    let config = await UnilevelConfig.findOne();
    
    if (!config) {
      // Default config
      config = await UnilevelConfig.create({
        levelDepth: 10,
        sponsorIncome: 5,
        levelCommission: [
          { level: 1, percentage: 10 },
          { level: 2, percentage: 5 },
          { level: 3, percentage: 3 },
          { level: 4, percentage: 2 },
          { level: 5, percentage: 1 }
        ]
      });
    }
    
    res.status(200).json({
      success: true,
      data: config
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= GET MATRIX CONFIG =================
export const getMatrixConfig = async (req, res) => {
  try {
    let config = await MatrixConfig.findOne();
    
    if (!config) {
      config = await MatrixConfig.create({
        matrixSize: "3x3",
        spilloverLogic: "auto",
        reEntryAllowed: false,
        reEntryLevel: 0
      });
    }
    
    res.status(200).json({
      success: true,
      data: config
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//===========================ROI PLAN==============================

export const getROIConfig = async (req, res) => {
  try {
    let config = await ROIConfig.findOne();
    
    if (!config) {
      config = await ROIConfig.create({
        roiPercentage: 5,
        roiFrequency: "daily",
        validityPeriod: 30,
        capitalLock: false,
        roiStopConditions: ["period_expiry", "max_reached"],
        maxROIAmount: 0,
        isActive: true
      });
    }
    
    res.status(200).json({
      success: true,
      data: config
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =================  INVESMENT/RANK PLANS =================
export const getAllRankPlans = async (req, res) => {
  try {
    const overrides = await RankPlan.find();
    const ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "VIP"];
    
    const plans = ranks.map(rank => {
      const defaultPlan = RANK_PLANS[rank];
      const override = overrides.find(o => o.rank === rank);
      
      return {
        rank,
        min: override?.min ?? defaultPlan.min,
        max: override?.max ?? defaultPlan.max,
        roi: override?.roi ?? defaultPlan.roi,
        duration: override?.duration ?? defaultPlan.duration,
        dailyPercent: override?.dailyPercent ?? defaultPlan.dailyPercent,
        isDefault: !override,
        updatedAt: override?.updatedAt || null
      };
    });
    
    res.status(200).json({ success: true, data: plans });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= GET ALL INVESTMENTS =================
export const getAllInvestments = async (req, res) => {
  try {
    const users = await User.find().select("name plans rank");
    
    let allInvestments = [];
    
    for (const user of users) {
      for (const plan of user.plans || []) {
        const rankLimits = RANK_PLANS[user.rank] || RANK_PLANS.Bronze;
        
        allInvestments.push({
          userName: user.name,
          plan: user.rank,
          amount: plan.amount,
          roi: `${rankLimits.roi}%`,
          status: plan.status || "active",
          date: plan.purchaseDate
        });
      }
    }
    
    res.status(200).json({
      success: true,
      investments: allInvestments
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= GET INVESTMENT BY USER ID =================
export const getInvestmentByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select("name plans rank");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const rankLimits = RANK_PLANS[user.rank] || RANK_PLANS.Bronze;
    
    const investments = (user.plans || []).map(plan => ({
      userName: user.name,
      plan: user.rank,
      amount: plan.amount,
      roi: `${rankLimits.roi}%`,
      status: plan.status || "active",
      date: plan.purchaseDate
    }));
    
    res.status(200).json({
      success: true,
      investments: investments
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET ALL DEPOSITS =================

export const getAllDeposits = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let deposits = await Deposit.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "name");
    
    if (search) {
      deposits = deposits.filter(deposit => {
        const userName = deposit.user?.name?.toLowerCase() || "";
        const amount = deposit.amount.toString();
        const transactionId = deposit.transactionId?.toLowerCase() || "";
        const searchLower = search.toLowerCase();
        
        return userName.includes(searchLower) || 
               amount.includes(searchLower) || 
               transactionId.includes(searchLower);
      });
    }
    
    const totalDeposits = await Deposit.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalDeposits / parseInt(limit)),
        totalDeposits: totalDeposits,
        limit: parseInt(limit)
      },
      deposits: deposits.map(deposit => ({
        userId: deposit.user?._id,
        userName: deposit.user?.name,
        amount: deposit.amount,
        paymentMethod: deposit.method,
        transactionId: deposit.transactionId,
        date: deposit.createdAt,
        status: deposit.status
      }))
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// =================  GET DEPOSIT BY USER ID =================

export const getDepositByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const deposits = await Deposit.find({ user: userId }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      deposits: deposits.map(deposit => ({
        userName: user.name,
        amount: deposit.amount,
        paymentMethod: deposit.method,
        transactionId: deposit.transactionId,
        date: deposit.createdAt,
        status: deposit.status
      }))
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ================= GET ALL COMMISSIONS =================
export const getAllCommissions = async (req, res) => {
  try {
    const { search, type, status, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (type && type !== "all") filter.type = type;
    if (status && status !== "all") filter.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let commissions = await Commission.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "name");
    
    if (search) {
      commissions = commissions.filter(commission => {
        const userName = commission.user?.name?.toLowerCase() || "";
        const amount = commission.amount.toString();
        const searchLower = search.toLowerCase();
        
        return userName.includes(searchLower) || amount.includes(searchLower);
      });
    }
    
    const totalCommissions = await Commission.countDocuments(filter);
    
    // Stats
    const stats = {
      total: await Commission.countDocuments(),
      totalAmount: await Commission.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      byType: {
        direct: await Commission.countDocuments({ type: "direct" }),
        level: await Commission.countDocuments({ type: "level" }),
        binary: await Commission.countDocuments({ type: "binary" }),
        roi: await Commission.countDocuments({ type: "roi" }),
        bonus: await Commission.countDocuments({ type: "bonus" })
      }
    };
    
    res.status(200).json({
      success: true,
      stats: {
        total: stats.total,
        totalAmount: stats.totalAmount[0]?.total || 0,
        byType: stats.byType
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCommissions / parseInt(limit)),
        totalCommissions: totalCommissions,
        limit: parseInt(limit)
      },
      commissions: commissions.map(commission => ({
        userName: commission.user?.name,
        type: commission.type,
        amount: commission.amount,
        plan: commission.plan,
        level: commission.level,
        status: commission.status,
        date: commission.createdAt
      }))
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET COMMISSION BY USER ID =================
export const getCommissionByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const commissions = await Commission.find({ user: userId }).sort({ createdAt: -1 });
    
    const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);
    
    res.status(200).json({
      success: true,
      stats: {
        totalCommissions: commissions.length,
        totalAmount: totalAmount
      },
      commissions: commissions.map(commission => ({
        userName: user.name,
        type: commission.type,
        amount: commission.amount,
        plan: commission.plan,
        level: commission.level,
        status: commission.status,
        date: commission.createdAt
      }))
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// ================= GET INCOME CONFIGURATION =================


export const getIncome = async (req, res) => {
  try {
    let config = await IncomeConfig.findOne();
    
    if (!config) {
      config = await IncomeConfig.create({
        directCommission: {
          active: true, autoCredit: true, minAmount: 0, maxAmount: 100000, percentage: 5
        },
        levelCommission: {
          active: true, autoCredit: true, minAmount: 0, maxAmount: 100000,
          levels: [
            { level: 1, percentage: 10 },
            { level: 2, percentage: 5 },
            { level: 3, percentage: 3 },
            { level: 4, percentage: 2 },
            { level: 5, percentage: 1 },
            { level: 6, percentage: 1 }
          ]
        },
        binaryCommission: {
          active: true, autoCredit: true, minAmount: 0, maxAmount: 100000, pairValue: 100
        },
        matchingBonus: {
          active: false, autoCredit: true, minAmount: 0, maxAmount: 50000, percentage: 5, levels: 3
        },
        leadershipBonus: {
          active: false, autoCredit: true, minAmount: 0, maxAmount: 100000, percentage: 3, rankRequired: "Gold"
        },
        roiCommission: {
          active: true, autoCredit: true, minAmount: 0, maxAmount: 100000,
          roiFrequency: "daily", roiPercentage: 5, validityPeriod: 30, capitalLock: false
        },
        rewardBonus: {
          active: false, autoCredit: true, minAmount: 0, maxAmount: 50000, rewardType: "fixed", rewardValue: 0
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error("Get Income Config Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= 1. GET  USERS WALLET  =================
export const getAllWallets = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    let userFilter = {};
    if (search) {
      userFilter = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(userFilter)
      .select("name email wallet isActive")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalUsers = await User.countDocuments(userFilter);
    
    // ================= WALLET SUMMARY (ARRAY 1) =================
    const walletSummary = await Promise.all(users.map(async (user) => {
      let wallet = await Wallet.findOne({ user: user._id });
      
      return {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        status: user.isActive ? "active" : "reject",
        wallets: [
          { type: "mainWallet", amount: user.wallet || 0 },
          { type: "incomeWallet", amount: wallet?.incomeWallet?.balance || 0 },
          { type: "roiWallet", amount: wallet?.roiWallet?.balance || 0 },
          { type: "fundWallet", amount: wallet?.fundWallet?.balance || 0 }
        ]
      };
    }));
    
    // ================= WALLET HISTORY (ARRAY 2) =================
    const allTransactions = [];
    for (const user of users) {
      const transactions = await Transaction.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(50);
      
      transactions.forEach(tx => {
        allTransactions.push({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          walletType: tx.walletType,
          type: tx.type,
          amount: tx.amount,
          date: tx.createdAt,
          status: tx.status === "paid" ? "active" : "reject"
        });
      });
    }
    
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const totalTransactions = allTransactions.length;
    const historyStart = (parseInt(page) - 1) * parseInt(limit);
    const historyEnd = historyStart + parseInt(limit);
    const paginatedHistory = allTransactions.slice(historyStart, historyEnd);
    
    res.status(200).json({
      success: true,
      stats: {
        totalUsers: totalUsers,
        totalTransactions: totalTransactions
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers: totalUsers,
        limit: parseInt(limit)
      },
      walletSummary: walletSummary,
      walletHistory: paginatedHistory
    });
    
  } catch (error) {
    console.error("Get All Wallets Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};




// ================= GET WITHDRAWAL  =================
export const getWithdrawal = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    // Get all withdrawals
    let filter = {};
    let withdrawals = await Withdrawal.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "name email");
    
    // Search filter
    if (search) {
      withdrawals = withdrawals.filter(w => 
        w.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        w.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        w.amount.toString().includes(search) ||
        w.transactionId?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // ================= 1. WITHDRAWAL REPORT =================
    const totalPending = withdrawals.filter(w => w.status === "pending").length;
    const totalApproved = withdrawals.filter(w => w.status === "approved").length;
    const totalRejected = withdrawals.filter(w => w.status === "rejected").length;
    const totalRequest = withdrawals.length;
    
    // Total amounts
    const totalPendingAmount = withdrawals
      .filter(w => w.status === "pending")
      .reduce((sum, w) => sum + w.amount, 0);
    const totalApprovedAmount = withdrawals
      .filter(w => w.status === "approved")
      .reduce((sum, w) => sum + w.amount, 0);
    const totalRejectedAmount = withdrawals
      .filter(w => w.status === "rejected")
      .reduce((sum, w) => sum + w.amount, 0);
    
    // ================= 2. WITHDRAWAL TRENDING =================
    const trending = {
      approved: totalApproved,
      pending: totalPending,
      rejected: totalRejected
    };
    
    // ================= 3. STATUS DURATION (PERCENTAGE) =================
    const total = totalRequest || 1;
    const statusPercentage = {
      pending: ((totalPending / total) * 100).toFixed(1),
      approved: ((totalApproved / total) * 100).toFixed(1),
      rejected: ((totalRejected / total) * 100).toFixed(1)
    };
    
    // ================= 4. HISTORY (PAGINATED) =================
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedWithdrawals = withdrawals.slice(skip, skip + parseInt(limit));
    
    const history = paginatedWithdrawals.map(w => ({
      id: w._id,
      userName: w.user?.name || "Unknown",
      userEmail: w.user?.email || "Unknown",
      amount: w.amount,
      method: w.method,
      transactionId: w.transactionId, 
      date: w.createdAt,
      status: w.status,
      taxAmount: w.taxAmount,
      finalAmount: w.finalAmount
    }));
    
    res.status(200).json({
      success: true,
      // 1. Withdrawal Report
      report: {
        totalPending: { count: totalPending, amount: totalPendingAmount },
        totalApproved: { count: totalApproved, amount: totalApprovedAmount },
        totalRejected: { count: totalRejected, amount: totalRejectedAmount },
        totalRequest: { count: totalRequest, amount: totalPendingAmount + totalApprovedAmount + totalRejectedAmount }
      },
      // 2. Withdrawal Trending
      trending: trending,
      // 3. Status Duration (Percentage)
      statusPercentage: statusPercentage,
      // 4. History
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRequest / parseInt(limit)),
        totalWithdrawals: totalRequest,
        limit: parseInt(limit)
      },
      history: history
    });
    
  } catch (error) {
    console.error("Get Withdrawal Management Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
