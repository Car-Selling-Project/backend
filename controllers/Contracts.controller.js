import Order from "../models/orders.schema.js";
import { uploadToCloudinary } from "../configs/cloudinary.config.js";
import path from "path";
import PdfPrinter from "pdfmake/src/printer.js";
// ...existing code...
import PDFDocument from 'pdfkit';
// ====== FONT CONFIG ======
const fontRegular = path.join(process.cwd(), "fonts", "Roboto-VariableFont_wdth,wght.ttf");
const fontItalic = path.join(process.cwd(), "fonts", "Roboto-Italic-VariableFont_wdth,wght.ttf");

const fonts = {
  Roboto: {
    normal: fontRegular,
    bold: fontRegular,
    italics: fontItalic,
    bolditalics: fontItalic,
  },
};

// ====== Sign Contract for SELLER ======
export const signContractSeller = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { signerName, signDate, signatureImage } = req.body;

    if (!signerName || !signDate) {
      return res.status(400).json({ message: "Missing signerName or signDate" });
    }

    // Lấy order + populate data liên quan
    const order = await Order.findById(orderId)
      .populate({
        path: "carInfo",
        populate: { path: "brandId", select: "name" },
      })
      .populate("admin", "name phone email")
      .populate("customerId");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Cập nhật thông tin ký
    if (!order.contract) order.contract = {};
    order.contract.signedBySeller = true;
    order.contract.signedBySellerName = signerName;
    order.contract.signedBySellerAt = new Date(signDate);

    // Lưu chữ ký (ảnh hoặc text)
    if (signatureImage) {
      order.contract.signatureImageSeller = signatureImage;
    }

    if (order.contract.signedByBuyer) {
      order.contract.signed = true;
    }

    // ==== PDF CREATE ====
    const printer = new PdfPrinter(fonts);
    const buyer = order.customerInfo;
    const car = order.carInfo;
    const contractDate = new Date().toLocaleDateString();

    // Tạo block chữ ký seller
    let sellerSignatureBlock;
    if (signatureImage && typeof signatureImage === "string") {
      if (signatureImage.startsWith("data:image")) {
        // Ảnh base64
        sellerSignatureBlock = {
          image: Buffer.from(signatureImage.split(",")[1], "base64"),
          width: 150,
          height: 50,
        };
      } else {
        // Text chữ ký
        sellerSignatureBlock = {
          text: signatureImage,
          fontSize: 18,
          italics: true,
          bold: true,
          margin: [0, 15, 0, 0],
        };
      }
    } else {
      sellerSignatureBlock = {
        canvas: [{ type: "rect", x: 0, y: 0, w: 150, h: 50, r: 5, lineColor: "black" }],
      };
    }

    // Tạo block chữ ký buyer (nếu có)
    let buyerSignatureBlock;
    if (order.contract.signatureImageBuyer && typeof order.contract.signatureImageBuyer === "string") {
      if (order.contract.signatureImageBuyer.startsWith("data:image")) {
        buyerSignatureBlock = {
          image: Buffer.from(order.contract.signatureImageBuyer.split(",")[1], "base64"),
          width: 150,
          height: 50,
        };
      } else {
        buyerSignatureBlock = {
          text: order.contract.signatureImageBuyer,
          fontSize: 18,
          italics: true,
          bold: true,
          margin: [0, 15, 0, 0],
        };
      }
    } else {
      buyerSignatureBlock = {
        canvas: [{ type: "rect", x: 0, y: 0, w: 150, h: 50, r: 5, lineColor: "black" }],
      };
    }

    // PDF Layout
    const docDefinition = {
      defaultStyle: { font: "Roboto" },
      content: [
        { text: "SALE CONTRACT", style: "header", alignment: "center", decoration: "underline" },
        { text: `Contract Date: ${contractDate}`, alignment: "center", margin: [0, 5, 0, 15] },

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
            {
              width: "50%",
              stack: [
                { text: "Seller Signature", margin: [0, 0, 0, 10] },
                sellerSignatureBlock,
                { text: order.contract.signedBySellerName || "", margin: [0, 5, 0, 10], bold: true },
                {
                  text: order.contract.signedBySellerAt
                    ? new Date(order.contract.signedBySellerAt).toLocaleDateString()
                    : "",
                  italics: true,
                },
              ],
            },
            {
              width: "50%",
              stack: [
                { text: "Buyer Signature", margin: [0, 0, 0, 10] },
                buyerSignatureBlock,
                { text: order.contract.signedByBuyerName || "", margin: [0, 5, 0, 10], bold: true },
                {
                  text: order.contract.signedByBuyerAt
                    ? new Date(order.contract.signedByBuyerAt).toLocaleDateString()
                    : "",
                  italics: true,
                },
              ],
            },
          ],
        },
      ],
      styles: {
        header: { fontSize: 22, bold: true },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 15, 0, 5] },
      },
    };

    // Tạo PDF và upload
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    let chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const pdfUrl = await uploadToCloudinary({ buffer: pdfBuffer });
      order.contract.url = pdfUrl;
      await order.save();
      res.json({
        message: "Seller signed contract successfully, contract updated",
        contract: order.contract,
      });
    });
    pdfDoc.end();
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

function makeTable(rows) {
  const filteredRows = rows.filter(([label, value]) => label || value);

  return {
    table: {
      widths: ["30%", "70%"],
      body: filteredRows.map(([label, value]) => [
        { 
          text: label || "", 
          bold: true, 
          alignment: "center", 
          verticalAlignment: "middle",
          margin: [0, 4, 4, 4], 
          fontSize: 10
        },
        { 
          text: value || "", 
          alignment: "center", 
          verticalAlignment: "middle",
          margin: [4, 4, 0, 4],
          fontSize: 10
        },
      ]),
    },
    layout: {
      hLineColor: () => "#aaaaaa",
      vLineColor: () => "#aaaaaa",
      hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 1 : 0.5),
      vLineWidth: () => 0.5,
      paddingLeft: () => 2,
      paddingRight: () => 2,
      paddingTop: () => 2,
      paddingBottom: () => 2
    },
  };
}



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
}

// Create Contract
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
// ====== HÀM KÝ HỢP ĐỒNG BÊN BUYER ======
export const signContractBuyer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { signerName, signDate, signatureImage } = req.body;

    if (!signerName || !signDate) {
      return res.status(400).json({ message: "Missing signerName or signDate" });
    }

    // Lấy order + populate data liên quan
    const order = await Order.findById(orderId)
      .populate({
        path: "carInfo",
        populate: { path: "brandId", select: "name" },
      })
      .populate("admin", "name phone email")
      .populate("customerId");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Cập nhật thông tin ký
    if (!order.contract) order.contract = {};
    order.contract.signedByBuyer = true;
    order.contract.signedByBuyerName = signerName;
    order.contract.signedByBuyerAt = new Date(signDate);

    // Lưu chữ ký (ảnh hoặc text)
    if (signatureImage) {
      order.contract.signatureImageBuyer = signatureImage;
    }

    if (order.contract.signedBySeller) {
      order.contract.signed = true;
    }

    // ==== Lấy ngày ký hợp đồng (ngày đầu tiên) ====
    let contractDateValue;
    if (order.contract?.signedBySellerAt) {
      contractDateValue = order.contract.signedBySellerAt;
    } else if (order.contract?.signedByBuyerAt && order.contract.signedByBuyerAt < new Date(signDate)) {
      contractDateValue = order.contract.signedByBuyerAt;
    } else {
      contractDateValue = new Date(signDate);
    }
    const contractDate = new Date(contractDateValue).toLocaleDateString();

    const printer = new PdfPrinter(fonts);
    const buyer = order.customerInfo;
    const car = order.carInfo;

    // Tạo block chữ ký buyer
    let buyerSignatureBlock;
    if (signatureImage && typeof signatureImage === "string") {
      if (signatureImage.startsWith("data:image")) {
        buyerSignatureBlock = {
          image: Buffer.from(signatureImage.split(",")[1], "base64"),
          width: 150,
          height: 50,
        };
      } else {
        buyerSignatureBlock = {
          text: signatureImage,
          fontSize: 18,
          italics: true,
          bold: true,
          margin: [0, 15, 0, 0],
        };
      }
    } else {
      buyerSignatureBlock = {
        canvas: [{ type: "rect", x: 0, y: 0, w: 150, h: 50, r: 5, lineColor: "black" }],
      };
    }

    // Tạo block chữ ký seller (nếu có)
    let sellerSignatureBlock;
    if (order.contract.signatureImageSeller && typeof order.contract.signatureImageSeller === "string") {
      if (order.contract.signatureImageSeller.startsWith("data:image")) {
        sellerSignatureBlock = {
          image: Buffer.from(order.contract.signatureImageSeller.split(",")[1], "base64"),
          width: 150,
          height: 50,
        };
      } else {
        sellerSignatureBlock = {
          text: order.contract.signatureImageSeller,
          fontSize: 18,
          italics: true,
          bold: true,
          margin: [0, 15, 0, 0],
        };
      }
    } else {
      sellerSignatureBlock = {
        canvas: [{ type: "rect", x: 0, y: 0, w: 150, h: 50, r: 5, lineColor: "black" }],
      };
    }

    // PDF Layout
    const docDefinition = {
      defaultStyle: { font: "Roboto" },
      content: [
        { text: "SALE CONTRACT", style: "header", alignment: "center", decoration: "underline" },
        { text: `Contract Date: ${contractDate}`, alignment: "center", margin: [0, 5, 0, 15] },

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
            {
              width: "50%",
              stack: [
                { text: "Seller Signature", margin: [0, 0, 0, 10] },
                sellerSignatureBlock,
                { text: order.contract.signedBySellerName || "", margin: [0, 5, 0, 10], bold: true },
                {
                  text: order.contract.signedBySellerAt
                    ? new Date(order.contract.signedBySellerAt).toLocaleDateString()
                    : "",
                  italics: true,
                },
              ],
            },
            {
              width: "50%",
              stack: [
                { text: "Buyer Signature", margin: [0, 0, 0, 10] },
                buyerSignatureBlock,
                { text: order.contract.signedByBuyerName || "", margin: [0, 5, 0, 10], bold: true },
                {
                  text: order.contract.signedByBuyerAt
                    ? new Date(order.contract.signedByBuyerAt).toLocaleDateString()
                    : "",
                  italics: true,
                },
              ],
            },
          ],
        },
      ],
      styles: {
        header: { fontSize: 22, bold: true },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 15, 0, 5] },
      },
    };

    // Tạo PDF và upload
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    let chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const pdfUrl = await uploadToCloudinary({ buffer: pdfBuffer });
      order.contract.url = pdfUrl;
      await order.save();
      res.json({
        message: "Buyer signed contract successfully, contract updated",
        contract: order.contract,
      });
    });
    pdfDoc.end();
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const getContractStatusForCustomer = async(req , res) =>{
  try{
    const { orderId } = req.params;
    const customerId = req.customer._id;
    if(!customerId) return res.status(401).json({ message: "Unauthorized" });
    const order = await Order.findOne(
      {_id: orderId, customerId},
      "contract"
    );
    if(!order) return res.status(404).json({ message: "Order not found" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}
