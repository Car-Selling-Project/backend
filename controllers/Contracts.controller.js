import Order from "../models/orders.schema.js";
import PDFDocument from "pdfkit";
import {uploadToCloudinary} from "../configs/cloudinary.config.js"
import path from "path";
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

const fontRegular = path.join(process.cwd(), "fonts", "Roboto-Regular.ttf");
const fontBold = path.join(process.cwd(), "fonts", "Roboto-Bold.ttf");

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
      .populate("admin", "name");

    if (!order) return res.status(404).json({ message: "Order not found" });

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    const pdfEndPromise = new Promise((resolve) =>
      doc.on("end", () => resolve(Buffer.concat(buffers)))
    );

    // ===== HEADER =====
    doc.font(fontBold).fontSize(22).fillColor("#2C3E50")
      .text("SALE CONTRACT", { align: "center", underline: true });
    doc.moveDown(0.5);
    doc.font(fontRegular).fontSize(12).fillColor("#555")
      .text(`Contract Date: ${new Date(signDate).toLocaleDateString()}`, { align: "center" });
    doc.moveDown(1);

    // ===== SELLER INFO =====
    doc.moveDown(0.5);
    doc.font(fontBold).fontSize(14).fillColor("#000").text("Seller Information");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#ccc").stroke();
    doc.moveDown(0.5);
    doc.font(fontRegular).fontSize(12).fillColor("#333")
      .text(`Name: ${order.admin?.name || ""}`, { align: "left" })
      .moveDown(1);

    // ===== BUYER INFO =====
    doc.font(fontBold).fontSize(14).fillColor("#000").text("Buyer Information");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#ccc").stroke();
    const buyer = order.customerInfo;
    doc.moveDown(0.5);
    doc.font(fontRegular).fontSize(12).fillColor("#333")
      .text(`Name: ${buyer.fullName || ""}`);
    if (buyer.email) doc.text(`Email: ${buyer.email}`);
    if (buyer.phone) doc.text(`Phone: ${buyer.phone}`);
    if (buyer.address) doc.text(`Address: ${buyer.address}`);
    if (buyer.citizenId) doc.text(`Citizen ID: ${buyer.citizenId}`);
    doc.moveDown(1);

    // ===== CAR INFO =====
    doc.font(fontBold).fontSize(14).fillColor("#000").text("Car Information");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#ccc").stroke();
    const car = order.carInfo;
    doc.moveDown(0.5);
    doc.font(fontRegular).fontSize(12).fillColor("#333")
      .text(`Title: ${car.title || ""}`);
    if (car.brandId?.name) doc.text(`Brand: ${car.brandId.name}`);
    if (car.model) doc.text(`Model: ${car.model}`);
    if (car.carType) doc.text(`Type: ${car.carType}`);
    if (car.exteriorColor) doc.text(`Color: ${car.exteriorColor.join(", ")}`);
    doc.moveDown(1);

    // ===== SALE DETAILS =====
    doc.font(fontBold).fontSize(14).fillColor("#000").text("Sale Details");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#ccc").stroke();
    doc.moveDown(0.5);
    doc.font(fontRegular).fontSize(12).fillColor("#333")
      .text(`Total Price: $${order.totalPrice.toFixed(2)}`);
    doc.moveDown(1);

    // ===== SIGNATURE =====
    doc.font(fontBold).fontSize(14).fillColor("#000").text("Signature");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#ccc").stroke();
    doc.moveDown(1.5);
    doc.font(fontRegular).fontSize(12).fillColor("#333")
      .text(`Signed by: ${signerName}`)
      .text(`Date: ${new Date(signDate).toLocaleDateString()}`);

    // End PDF
    doc.end();
    const pdfBuffer = await pdfEndPromise;

    // Upload
    const pdfUrl = await uploadContractToCloudinary({ buffer: pdfBuffer });

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