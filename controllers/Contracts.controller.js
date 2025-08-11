import Order from "../models/orders.schema.js";
import {uploadToCloudinary} from "../configs/cloudinary.config.js"
import path from "path";
import PDFDocument from "pdfkit-table";
// Ký hợp đồng bên Seller (Admin)
export const signContractSeller = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { signerName, signDate } = req.body;

    if (!signerName || !signDate) {
      return res.status(400).json({ message: "Missing signerName or signDate" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.contract) order.contract = {};

    order.contract.signedBySeller = true;
    order.contract.signedBySellerName = signerName;
    order.contract.signedBySellerAt = new Date(signDate);
    if (order.contract.signedByBuyer) {
      order.contract.signed = true;
    }

    await order.save();

    res.json({ message: "Seller signed contract successfully", contract: order.contract });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getContractStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId, "contract");
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ contractStatus: order.contract || {} });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const fontRegular = path.join(process.cwd(), "fonts", "TIMES.TTF");
const fontBold = path.join(process.cwd(), "fonts", "TIMESBD.TTF");

export const generateAndUploadContract = async (req, res) => {
  try {
    const { orderId, signerName, signDate } = req.body;
    if (!orderId || !signerName || !signDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const order = await Order.findById(orderId)
      .populate({
        path: "carInfo",
        populate: { path: "brandId", select: "name" },
      })
      .populate("customerInfo", "fullName email phone address citizenId")
      .populate("admin", "name phone email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.registerFont("Times-Regular", fontRegular);
    doc.registerFont("Times-Bold", fontBold);

    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    const pdfEndPromise = new Promise((resolve) =>
      doc.on("end", () => resolve(Buffer.concat(buffers)))
    );

    // Tùy chọn bảng chung
    const defaultTableOpts = {
      hideHeader: true,
      columnsSize: [150, 350],
      prepareRow: (row, i) => doc.font("Times-Regular").fontSize(12),
    };

    // ===== HEADER =====
    doc.font("Times-Bold").fontSize(22).fillColor("#2C3E50")
      .text("SALE CONTRACT", { align: "center", underline: true });
    doc.moveDown(0.5);
    doc.font("Times-Regular").fontSize(12).fillColor("#555")
      .text(`Contract Date: ${new Date(signDate).toLocaleDateString()}`, { align: "center" });
    doc.moveDown(1);

    // ===== SELLER INFO =====
    doc.font("Times-Bold").fontSize(14).fillColor("#000").text("Seller Information");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#ccc").stroke();
    doc.moveDown(0.5);
    await doc.table(
      {
        rows: [
          ["Name", order.admin?.name || ""],
          ["Phone", order.admin?.phone || ""],
          ["Email", order.admin?.email || ""],
        ],
      },
      defaultTableOpts
    );
    doc.moveDown(1);

    // ===== BUYER INFO =====
    const buyer = order.customerInfo;
    doc.font("Times-Bold").fontSize(14).fillColor("#000").text("Buyer Information");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#ccc").stroke();
    doc.moveDown(0.5);
    await doc.table(
      {
        rows: [
          ["Name", buyer.fullName || ""],
          ["Email", buyer.email || ""],
          ["Phone", buyer.phone || ""],
          ["Address", buyer.address || ""],
          ["Citizen ID", buyer.citizenId || ""],
        ],
      },
      defaultTableOpts
    );
    doc.moveDown(1);

    // ===== CAR INFO =====
    const car = order.carInfo;
    doc.font("Times-Bold").fontSize(14).fillColor("#000").text("Car Information");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#ccc").stroke();
    doc.moveDown(0.5);
    await doc.table(
      {
        rows: [
          ["Title", car.title || ""],
          ["Brand", car.brandId?.name || ""],
          ["Model", car.model || ""],
          ["Type", car.carType || ""],
          ["Color", Array.isArray(car.exteriorColor) ? car.exteriorColor.join(", ") : ""],
        ],
      },
      defaultTableOpts
    );
    doc.moveDown(1);

    // ===== SALE DETAILS =====
    doc.font("Times-Bold").fontSize(14).fillColor("#000").text("Sale Details");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#ccc").stroke();
    doc.moveDown(0.5);
    await doc.table(
      {
        rows: [["Total Price", `$${order.totalPrice.toFixed(2)}`]],
      },
      defaultTableOpts
    );
    doc.moveDown(1);

    // ===== SIGNATURE =====
    doc.font("Times-Bold").fontSize(14).fillColor("#000").text("Signature");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#ccc").stroke();
    doc.moveDown(2);

    // Seller signature box
    doc.font("Times-Regular").fontSize(12).text("Seller Signature", 100, doc.y, { align: "left" });
    doc.moveDown(3);
    doc.moveTo(80, doc.y).lineTo(220, doc.y).strokeColor("#000").stroke();

    // Buyer signature box
    const buyerX = 350;
    doc.font("Times-Regular").fontSize(12).text("Buyer Signature", buyerX, doc.y - 60, { align: "left" });
    doc.moveDown(3);
    doc.moveTo(buyerX, doc.y).lineTo(buyerX + 140, doc.y).strokeColor("#000").stroke();

    doc.end();

    const pdfBuffer = await pdfEndPromise;

    // Upload
    const pdfUrl = await uploadToCloudinary({ buffer: pdfBuffer });

    // Save DB
    order.contract = {
      url: pdfUrl,
      signed: true,
      signedBySeller: true,
      signedBySellerName: signerName,
      signedBySellerAt: new Date(signDate),
    };
    await order.save();

    res.json({
      message: "Contract generated and uploaded successfully",
      contractUrl: pdfUrl,
    });
  } catch (error) {
    console.error("Error generating contract:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
