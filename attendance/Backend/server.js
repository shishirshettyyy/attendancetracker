const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const cron = require("node-cron");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, required: true },
  confidence: { type: Number, required: true }, // Confidence Level Added
  time: { type: String, required: true },
  date: { type: String, required: true },
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

// 🔹 Daily Attendance Reset (Runs at Midnight)
cron.schedule("0 0 * * *", async () => {                // */1 * * * * for  1min demo
  const today = new Date().toISOString().split("T")[0];   //remove
  await Attendance.deleteMany({date: { $ne: today } });                     //remove this date: { $ne: today } for demo
  console.log("🕒 Attendance reset for a new day!");
});

// 🔹 Mark Attendance Route
app.post("/mark-attendance", async (req, res) => {
  try {
    const { name, status, confidence, time } = req.body;
    const today = new Date().toISOString().split("T")[0];

    if (!name || !status || !confidence || !time) {
      return res.status(400).json({ error: "❌ Missing required fields" });
    }

    if (confidence < 0.8) {
      return res.status(400).json({ error: "⚠️ Face recognition confidence too low" });
    }

    // Check if attendance already marked today
    const existingRecord = await Attendance.findOne({ name, date: today });

    if (existingRecord) {
      return res.status(400).json({ error: `⛔ ${name} already marked present today` });
    }

    const newRecord = new Attendance({ name, status, confidence, time, date: today });
    await newRecord.save();

    res.status(201).json({ message: "✅ Attendance marked successfully!", data: newRecord });
  } catch (err) {
    res.status(500).json({ error: "❌ Server error" });
  }
});

// 🔹 Get Today's Attendance List
app.get("/attendance", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const records = await Attendance.find({ date: today });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ error: "❌ Server error" });
  }
});

// 🔹 Export Attendance as CSV
app.get("/export-csv", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const records = await Attendance.find({ date: today });

    if (records.length === 0) {
      return res.status(404).json({ error: "⚠️ No attendance records found for today" });
    }

    const csvFields = ["name", "status", "confidence", "time", "date"];
    const json2csvParser = new Parser({ fields: csvFields });
    const csv = json2csvParser.parse(records);

    res.header("Content-Type", "text/csv");
    res.attachment(`attendance_${today}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: "❌ Error exporting CSV" });
  }
});

// 🔹 Export Attendance as PDF
// const PDFDocument = require("pdfkit");
// const fs = require("fs");

app.get("/export-pdf", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const records = await Attendance.find({ date: today });

    if (records.length === 0) {
      return res.status(404).json({ error: "⚠️ No attendance records found for today" });
    }

    const filePath = `attendance_${today}.pdf`;
    const doc = new PDFDocument({ margin: 40 });

    // Stream to file
    doc.pipe(fs.createWriteStream(filePath));

    // 🏷️ Title
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#007AFF") // Blue color
      .text("Attendance Report", { align: "center" })
      .moveDown(1);

    // 🗓️ Date
    doc
      .fontSize(14)
      .fillColor("black")
      .text(`Date: ${today}`, { align: "center" })
      .moveDown(1);

    // 📌 Table Header
    const tableTop = doc.y;
    const columnWidths = [150, 120, 100, 120];
    const startX = 40;

    doc
      .rect(startX, tableTop, 500, 30) // Header background
      .fill("#007AFF") // Blue color
      .stroke();

    doc
      .fillColor("white")
      .fontSize(12)
      .text("Name", startX + 10, tableTop + 8, { width: columnWidths[0], align: "left" })
      .text("Status", startX + 160, tableTop + 8, { width: columnWidths[1], align: "center" })
      .text("Confidence", startX + 280, tableTop + 8, { width: columnWidths[2], align: "center" })
      .text("Time", startX + 390, tableTop + 8, { width: columnWidths[3], align: "center" });

    doc.moveDown(1);

    // 📝 Table Content
    records.forEach(({ name, status, confidence, time }, index) => {
      const rowY = tableTop + 35 + index * 25;

      doc
        .rect(startX, rowY, 500, 25)
        .fill(index % 2 === 0 ? "#F3F3F3" : "#FFFFFF") // Alternate row colors
        .stroke();

      doc
        .fillColor("black")
        .text(name, startX + 10, rowY + 8, { width: columnWidths[0], align: "left" })
        .text(status, startX + 160, rowY + 8, { width: columnWidths[1], align: "center" })
        .text(`${Math.round(confidence * 100)}%`, startX + 280, rowY + 8, { width: columnWidths[2], align: "center" })
        .text(time, startX + 390, rowY + 8, { width: columnWidths[3], align: "center" });
    });

    doc.moveDown(2);

    // 📌 Footer
    doc
      .fillColor("#333")
      .fontSize(10)
      .text("Generated Automatically - Face Recognition Attendance System", { align: "center" });

    doc.end();

    // Wait and send file
    setTimeout(() => {
      res.download(filePath, (err) => {
        if (err) console.error("❌ Error downloading PDF:", err);
        fs.unlinkSync(filePath); // Delete after download
      });
    }, 1000);
  } catch (err) {
    res.status(500).json({ error: "❌ Error exporting PDF" });
  }
});



// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
