import { Ticket } from "../models/Ticket.js";
import { generateTicketId } from "../Utils/TICKET.js";

export const createTicket = async (req, res) => {
    try {
        const { subject, category, priority, description } = req.body;
        const newTicket = await Ticket.create({
            ticketId: generateTicketId(),
            userId: req.user._id,
            subject, category, priority, description,
            attachment: req.file ? req.file.path : null, 
            status: 'pending'
        });

        await newTicket.save();
        res.status(201).json({ success: true, message: "Ticket raised successfully", ticket: newTicket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getMyTickets = async (req, res) => {
    try {
        const { status } = req.query;
        let query = { userId: req.user._id };
        if (status && status !== 'All') query.status = status.toLowerCase();
        const tickets = await Ticket.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getAllTickets = async (req, res) => {
    try {
        const { status } = req.query;
        let filter = {};
        if (status && status !== 'All') filter.status = status.toLowerCase();

        const tickets = await Ticket.find(filter)
            .populate('userId', 'name email') 
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, allTickets: tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ----------------Update Status-----------
export const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params; 
        const { status } = req.body; 
        const ticket = await Ticket.findByIdAndUpdate(id, { status }, { new: true });
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
        res.status(200).json({ success: true, message: `Status updated to ${status}`, ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const addReply = async (req, res) => {
    try {
        const { ticketId, message } = req.body; 
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        if (ticket.status === 'rejected' || ticket.status === 'closed') {
            return res.status(400).json({ success: false, message: "Issue is closed." });
        }

        ticket.replies.push({
            senderId: req.user._id,
            senderType: req.user.role === 'admin' ? 'Admin' : 'User',
            message
        });
        await ticket.save();
        res.status(200).json({ success: true, ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};