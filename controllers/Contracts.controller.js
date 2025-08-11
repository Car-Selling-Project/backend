import Order from "../models/orders.schema.js";
import { uploadToCloudinary } from "../configs/cloudinary.config.js";
import path from "path";
import PdfPrinter from "pdfmake/src/printer.js";

// ====== FONT CONFIG (Roboto supports full Vietnamese charset) ======
const fontRegular = path.join(process.cwd(), "fonts", "Roboto-VariableFont_wdth,wght.ttf");
const fontItalic = path.join(process.cwd(), "fonts", "Roboto-Italic-VariableFont_wdth,wght.ttf");

const fonts = {
  Roboto: {
    normal: fontRegular,
    bold: fontRegular, // pdfmake applies weight automatically when bold: true
    italics: fontItalic,
    bolditalics: fontItalic,
  },
};

// ====== SIGN CONTRACT BY SELLER ======
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

// ====== GET CONTRACT STATUS ======
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

function makeTable(rows) {
  return {
    table: {
      widths: [150, "*"],
      body: [
        [{ text: "Field", bold: true }, { text: "Value", bold: true }],
        ...rows,
      ],
    },
    margin: [0, 0, 0, 10],
  };
}

export const createContract = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Missing required field: orderId" });
    }

    const order = await Order.findById(orderId)
      .populate({
        path: "carInfo",
        populate: { path: "brandId", select: "name" },
      })
      .populate("admin", "name phone email")
      .populate("customerId");

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.contract && order.contract.url) {
      return res.status(400).json({ message: "Contract already exists" });
    }

    const printer = new PdfPrinter(fonts);

    const buyer = order.customerInfo;
    const car = order.carInfo;

    const contractDate = new Date().toLocaleDateString("en-US");

    const docDefinition = {
      defaultStyle: { font: "Roboto" },
      content: [
        {
          text: "SALE CONTRACT",
          style: "header",
          alignment: "center",
          decoration: "underline",
        },
        {
          text: `Contract Date: ${contractDate}`,
          alignment: "center",
          margin: [0, 5, 0, 15],
        },

        { text: "Seller Information", style: "sectionHeader" },
        makeTable([
          ["Name", order.admin?.name || ""],
          ["Phone", order.admin?.phone || ""],
          ["Email", order.admin?.email || ""],
        ]),

        { text: "Buyer Information", style: "sectionHeader" },
        makeTable([
          ["Name", buyer.fullName || ""],
          ["Email", buyer.email || ""],
          ["Phone", buyer.phone || ""],
          ["Address", buyer.address || ""],
          ["Citizen ID", buyer.citizenId || ""],
        ]),

        { text: "Car Information", style: "sectionHeader" },
        makeTable([
          ["Title", car.title || ""],
          ["Brand", car.brandId?.name || ""],
          ["Model", car.model || ""],
          ["Type", car.carType || ""],
          [
            "Color",
            Array.isArray(car.exteriorColor)
              ? car.exteriorColor.join(", ")
              : car.exteriorColor || "",
          ],
        ]),

        { text: "Sale Details", style: "sectionHeader" },
        makeTable([["Total Price", `$${order.totalPrice.toFixed(2)}`]]),

        { text: "Signatures", style: "sectionHeader" },
        {
          columns: [
            { text: `\n\nSeller Signature\n\n____________________`, width: "50%" },
            { text: `\n\nBuyer Signature\n\n____________________`, width: "50%" },
          ],
        },
      ],
      styles: {
        header: { fontSize: 22, bold: true },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 15, 0, 5] },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    let chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const pdfUrl = await uploadToCloudinary({ buffer: pdfBuffer });

      order.contract = {
        url: pdfUrl,
        signedBySeller: false,
        signedBySellerName: null,
        signedBySellerAt: null,
        signedByBuyer: false,
        signedByBuyerName: null,
        signedByBuyerAt: null,
        signed: false,
      };

      await order.save();

      res.json({
        message: "Contract created successfully (unsigned)",
        contractUrl: pdfUrl,
        contract: order.contract,
      });
    });
    pdfDoc.end();
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
