import { Transaction } from "../models/transection.js";
import { getDateRange } from "../Utils/DateFilter.js";
import { exportToExcel } from "../Utils/Excel.js";
import { getFYRange, getQuarterRange } from "../Utils/Financial.js";
import { User } from "../models/User.js";
import { Withdrawal } from "../models/Withdrawal.js";


//================== Income Report =================



export const getIncomeReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const { range, export: isExport } = req.query;

        let query = { user: userId, type: "credit" };
        const dateFilter = getDateRange(range);
        if (dateFilter) query.createdAt = dateFilter;

        
        const incomes = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .lean();


        const summary = {
            totalIncome: 0,
            paidIncome: 0,
            pendingIncome: 0,
            totalTransactions: incomes.length
        };

        incomes.forEach(inc => {
            summary.totalIncome += inc.amount;
            if (inc.status === "paid" || inc.status === "success") {
                summary.paidIncome += inc.amount;
            } else if (inc.status === "pending") {
                summary.pendingIncome += inc.amount;
            }
        });


        const formattedData = incomes.map(inc => ({
            date: new Date(inc.createdAt).toLocaleDateString('en-US'), // MM/DD/YYYY
            type: inc.source || inc.description || "General Income", 
            amount: inc.amount,
            memberSource: inc.description || "System",
            status: inc.status ? inc.status.charAt(0).toUpperCase() + inc.status.slice(1) : "Paid"
        }));

        // 3. EXCEL EXPORT LOGIC
        if (isExport === "true") {
            const columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Type', key: 'type', width: 25 },
                { header: 'Amount', key: 'amount', width: 15 },
                { header: 'Member/Source', key: 'memberSource', width: 25 },
                { header: 'Status', key: 'status', width: 12 }
            ];
            return exportToExcel(res, `Income_Report_${range || 'all'}`, columns, formattedData);
        }

        // 4. JSON RESPONSE
        res.status(200).json({
          success: true,
          data: {
            summary,
            history: formattedData
          }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


//===================Join Report====================




export const getJoiningReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const { range, export: isExport } = req.query;

        // 1. POORI TEAM NIKALNE KA LOGIC (Recursive)
        const fetchTeam = async (parentIds, currentLevel, allMembers = []) => {
            if (currentLevel > 10) return allMembers; // Level limit (optional)

            const members = await User.find({ parentUnilevel: { $in: parentIds } })
                .populate("parentUnilevel", "name")
                .select("name email createdAt isActive parentUnilevel")
                .lean();

            if (members.length === 0) return allMembers;

            const membersWithLevel = members.map(m => ({
                ...m,
                level: currentLevel,
                sponsorName: m.parentUnilevel ? m.parentUnilevel.name : "You"
            }));

            allMembers.push(...membersWithLevel);
            const nextParentIds = members.map(m => m._id);
            return fetchTeam(nextParentIds, currentLevel + 1, allMembers);
        };

        let fullTeam = await fetchTeam([userId], 1);

        // 2. DATE FILTER APPLY KAREIN (Filter in Memory)
        const dateFilter = getDateRange(range);
        if (dateFilter && dateFilter.$gte) {
            const startTime = new Date(dateFilter.$gte).getTime();
            fullTeam = fullTeam.filter(m => new Date(m.createdAt).getTime() >= startTime);
        }

        // 3. STATS CALCULATION (Top Cards)
        const stats = {
            totalTeamMember: fullTeam.length,
            activeMember: fullTeam.filter(m => m.isActive).length,
            inactiveMember: fullTeam.filter(m => !m.isActive).length,
            directReferral: fullTeam.filter(m => m.level === 1).length
        };

        // 4. DATA FORMATTING (Exact fields jo aapne maangi)
        const formattedList = fullTeam.map(m => ({
            name: m.name,
            email: m.email,
            joinDate: new Date(m.createdAt).toLocaleDateString('en-US'),
            level: `Level ${m.level}`,
            sponsor: m.sponsorName === req.user.name ? "You" : m.sponsorName,
            status: m.isActive ? "Active" : "Inactive"
        }));

        // 5. EXCEL EXPORT LOGIC
        if (isExport === "true") {
            const columns = [
                { header: 'Name', key: 'name', width: 25 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Join Date', key: 'joinDate', width: 15 },
                { header: 'Level', key: 'level', width: 15 },
                { header: 'Sponsor', key: 'sponsor', width: 25 },
                { header: 'Status', key: 'status', width: 15 }
            ];
            return exportToExcel(res, `Joining_Report_${range || 'all'}`, columns, formattedList);
        }

        // 6. JSON RESPONSE
        res.status(200).json({
            success: true,
            data: {
                summary: stats,
                history: formattedList
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



//=========================FOUND REPORT CONTROLLER========================


export const getFundTransferReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const { range, export: isExport } = req.query;

        // 1. FILTER LOGIC (Sirf Transfer type transactions)
        let query = { user: userId, type: "transfer" }; 
        const dateFilter = getDateRange(range);
        if (dateFilter) query.createdAt = dateFilter;

        const transfers = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // 2. STATS CALCULATION (Top Cards)
        const summary = {
            totalTransfers: transfers.length,
            totalAmount: transfers.reduce((sum, item) => sum + item.amount, 0),
            completed: transfers.filter(t => t.status === "completed" || t.status === "success").length,
            pending: transfers.filter(t => t.status === "pending").length
        };

        // 3. DATA FORMATTING (Exact fields jaisa aapne demo diya)
        const formattedList = transfers.map(t => ({
            date: new Date(t.createdAt).toLocaleDateString('en-US'),
            from: t.fromWallet || "Main Wallet",
            to: t.toWallet || "Income Wallet",
            amount: t.amount,
            status: t.status.charAt(0).toUpperCase() + t.status.slice(1)
        }));

        // 4. EXCEL EXPORT LOGIC
        if (isExport === "true") {
            const columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'From', key: 'from', width: 20 },
                { header: 'To', key: 'to', width: 20 },
                { header: 'Amount', key: 'amount', width: 15 },
                { header: 'Status', key: 'status', width: 15 }
            ];
            return exportToExcel(res, `Fund_Transfer_Report_${range || 'all'}`, columns, formattedList);
        }

        // 5. JSON RESPONSE
        res.status(200).json({
            success: true,
            data: {
                summary,
                history: formattedList
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



//==========================Withdrawal Report Controller========================




export const getWithdrawalReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const { range, export: isExport } = req.query;

        // 1. FILTER: Sirf withdrawal category
        let query = { user: userId }; 
        const dateFilter = getDateRange(range);
        if (dateFilter) query.createdAt = dateFilter;

        const withdrawals = await Withdrawal.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // 2. STATS CALCULATION (Aapke Demo ke hisaab se)
        const summary = {
            totalWithdrawals: withdrawals.length,
            totalAmount: 0,
            totalCharges: 0,
            netAmount: 0,
            completed: 0
        };

        withdrawals.forEach(t => {
            summary.totalAmount += t.amount;
            summary.totalCharges += (t.charges || 0);
            summary.netAmount += (t.amount - (t.charges || 0));
            
            if (t.status.toLowerCase() === "completed" || t.status.toLowerCase() === "success") {
                summary.completed += 1;
            }
        });

        // 3. DATA FORMATTING (Exact fields as per demo)
        const formattedList = withdrawals.map(t => ({
            date: new Date(t.createdAt).toLocaleDateString('en-US'),
            amount: t.amount,
            method: t.withdrawalMethod || "Bank Transfer", // Bank, UPI, Crypto
            charges: t.charges || 0,
            netAmount: t.amount - (t.charges || 0),
            transactionId: t.transactionId || t._id.toString().slice(-8).toUpperCase(),
            status: t.status.charAt(0).toUpperCase() + t.status.slice(1)
        }));

        // 4. EXCEL EXPORT LOGIC
        if (isExport === "true") {
            const columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Amount', key: 'amount', width: 15 },
                { header: 'Method', key: 'method', width: 20 },
                { header: 'Charges', key: 'charges', width: 15 },
                { header: 'Net Amount', key: 'netAmount', width: 15 },
                { header: 'Transaction ID', key: 'transactionId', width: 20 },
                { header: 'Status', key: 'status', width: 15 }
            ];
            return exportToExcel(res, `Withdrawal_Report_${range || 'all'}`, columns, formattedList);
        }

        // 5. JSON RESPONSE
        res.status(200).json({
            success: true,
            data: {
                summary,
                history: formattedList
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


//==========================Tax Report========================





export const getTaxReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fy, quarter, range, from, to, export: isExport } = req.query;

        let dateFilter = {};

        // 1. PRIORITY LOGIC FOR FILTERS
        if (fy) {
            // Case A: Financial Year or Quarter
            if (quarter) {
                dateFilter = getQuarterRange(quarter, fy);
            } else {
                dateFilter = getFYRange(fy);
            }
        } else if (range) {
            // Case B: Standard Filters (Today, Week, Month, etc.)
            dateFilter = getDateRange(range);
        } else if (from && to) {
            // Case C: Custom Date Picker
            dateFilter = {
                $gte: new Date(new Date(from).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(to).setHours(23, 59, 59, 999))
            };
        } else {
            //  Current Financial Year
            dateFilter = getFYRange("2026-27");
        }

        //  DATABASE QUERY
        const records = await Transaction.find({
            user: userId,
            type: "credit",
            createdAt: dateFilter
        }).sort({ createdAt: 1 }).lean();

        // 3. STATS CALCULATION
        const summary = {
            grossIncome: 0,
            totalDeductions: 0,
            taxableAmount: 0,
            taxTDSDeducted: 0,
            netReceived: 0
        };

        const formattedList = records.map(r => {
            const gross = r.amount || 0;
            const deduction = r.adminCharges || 0;
            const taxable = gross - deduction;
            const tdsRate = 10; 
            const tdsAmount = (taxable * tdsRate) / 100;
            const net = taxable - tdsAmount;

            summary.grossIncome += gross;
            summary.totalDeductions += deduction;
            summary.taxableAmount += taxable;
            summary.taxTDSDeducted += tdsAmount;
            summary.netReceived += net;

            return {
                period: new Date(r.createdAt).toLocaleDateString('en-US'),
                incomeType: r.incomeType || "General Commission",
                gross: gross.toFixed(2),
                deduction: deduction.toFixed(2),
                taxable: taxable.toFixed(2),
                taxRate: `${tdsRate}%`,
                tds: tdsAmount.toFixed(2),
                netAmount: net.toFixed(2),
                status: r.isTaxFiled ? "Filed" : "Pending"
            };
        });

        // 4. EXCEL EXPORT
        if (isExport === "true") {
            const columns = [
                { header: 'Date', key: 'period', width: 15 },
                { header: 'Type', key: 'incomeType', width: 20 },
                { header: 'Gross', key: 'gross', width: 12 },
                { header: 'Deduction', key: 'deduction', width: 12 },
                { header: 'Taxable', key: 'taxable', width: 12 },
                { header: 'TDS Rate', key: 'taxRate', width: 10 },
                { header: 'TDS Amount', key: 'tds', width: 12 },
                { header: 'Net Amount', key: 'netAmount', width: 12 },
                { header: 'Status', key: 'status', width: 12 }
            ];
            return exportToExcel(res, "Tax_Report", columns, formattedList);
        }

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    grossIncome: summary.grossIncome.toFixed(2),
                    totalDeductions: summary.totalDeductions.toFixed(2),
                    taxableAmount: summary.taxableAmount.toFixed(2),
                    taxTDSDeducted: summary.taxTDSDeducted.toFixed(2),
                    netReceived: summary.netReceived.toFixed(2)
                },
                history: formattedList
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};                              