import Order from "../models/orders.schema.js";
import { uploadToCloudinary } from "../configs/cloudinary.config.js";
import path from "path";
import puppeteer from "puppeteer";
import PdfPrinter from "pdfmake";
import {computeContractStatus, computeOrderStatus} from "../helper.js"
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

// ================== SELLER ==================
export const signContractSeller = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { signatureImage } = req.body;

    // Lấy order
    const order = await Order.findById(orderId)
      .populate({ path: "carInfo", populate: { path: "brandId", select: "name" } })
      .populate("admin", "name phone email")
      .populate("customerId");

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.contract) order.contract = {};

    // Cập nhật seller ký
    order.contract.signedBySeller = true;
    order.contract.signedBySellerName = order.admin?.name || "N/A";
    order.contract.signedBySellerAt = new Date();
    if (signatureImage) order.contract.signatureImageBySeller = signatureImage;

    // Cập nhật trạng thái contract + order
    computeContractStatus(order.contract);
    computeOrderStatus(order);

    const buyer = order.customerId;
    const car = order.carInfo;
    const contractDate = new Date().toLocaleDateString();

    // Helper render chữ ký
    const renderSignature = (sig) => {
      if (!sig) return `<div style='font-style:italic;color:#888;'>Not Signed</div>`;
      const isImage = typeof sig === "string" && (sig.startsWith("data:image") || sig.startsWith("http"));
      return isImage
        ? `<img src='${sig}' alt='Signature' style='max-width:180px;max-height:60px;display:block;margin:0 auto;' />`
        : `<div style='font-family:monospace;font-size:1.1rem;color:#222;margin-top:4px;'>${sig}</div>`;
    };

    const sellerSignHTML = renderSignature(order.contract.signatureImageBySeller);
    const buyerSignHTML = renderSignature(order.contract.signatureImageByBuyer);

    // HTML hợp đồng
    const contractHTML = `<!DOCTYPE html><html><head><meta charset='utf-8'><style>
      body { font-family: Arial, sans-serif; font-size: 14px; background: #fff; color: #222; margin: 0; }
      .contract-container { max-width: 700px; margin: 30px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 32px 36px 28px 36px; border: 1px solid #e3e3e3; }
      h2 { text-align: center; font-size: 1.5rem; color: #222; margin-bottom: 18px; font-weight: bold; }
      .contract-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
      .contract-table td { padding: 6px 8px; vertical-align: top; }
      .contract-table .label { font-weight: bold; width: 160px; }
      .contract-table .value { width: 70%; }
      .section-title { font-weight: bold; margin-top: 18px; margin-bottom: 8px; font-size: 1.08rem; color: #2a5d9f; }
      .sign-footer { margin-top: 40px; display: flex; justify-content: space-between; }
      .sign-footer .sign-label { font-weight: bold; }
      .sign-footer .sign-name { margin-top: 32px; min-width: 180px; border-bottom: 1px solid #222; display: inline-block; }
      </style></head><body>
      <div class='contract-container'>
      <h2>CAR SALE AGREEMENT</h2>
      <table class='contract-table'>
        <tr><td class='label'>Seller:</td><td class='value'>${order.admin?.name || "N/A"}</td></tr>
        <tr><td class='label'>Buyer:</td><td class='value'>${buyer?.fullName || ""}</td></tr>
        <tr><td class='label'>Vehicle:</td><td class='value'>${car?.title || ""} (${car?.brandId?.name || ""}, ${car?.model || ""})</td></tr>
        <tr><td class='label'>Vehicle Identification Number:</td><td class='value'>${car?.vin || "__________"}</td></tr>
      </table>
      <div class='section-title'>Terms:</div>
      <ol style='margin-left:18px;'>
        <li>The date of the sale of the Vehicle will be <b>${contractDate}</b>.</li>
        <li>The total purchase price of the Vehicle will be <b>${order.totalPrice ? `$${order.totalPrice.toFixed(2)}` : "__________"}</b> Dollars </li>
        <li>In exchange for the Vehicle, the Buyer will pay Seller the total purchase price of the Vehicle on the day of the sale by cashier’s check, money order, or cash.</li>
        <li>Upon receipt of payment as provided above, The Seller agrees to provide the following documents to Buyer on the sale date:<br>&bull; Certificate of Title (including Odometer Disclosure Section), signed by Seller.<br>&bull; The current registration for the Vehicle.</li>
        <li>The Seller agrees to deliver the Vehicle to Buyer with a current registration and a clear title. Seller warrants that Seller is the legal owner of the Vehicle and that the Vehicle is free of all legal claims, liens, and encumbrances. The Seller agrees to pay for and deliver any necessary smog certification to Buyer before the sale date.</li>
        <li>The Vehicle is sold "as is," and the Seller makes no express or implied warranties as to the condition or performance of the Vehicle, except as follows: to the best of Seller’s knowledge, this vehicle:<br><input type='checkbox'> is <input type='checkbox'> is not a salvage vehicle.<br><input type='checkbox'> has <input type='checkbox'> has not been declared a total loss by an insurance company.<br><input type='checkbox'> has <input type='checkbox'> has not been repaired pursuant to a Lemon Law.</li>
        <li>The Buyer agrees to register the Vehicle in his/her name with the California Department of Motor Vehicles within one week of the date of the sale.</li>
      </ol>
      <div class='sign-footer'>
        <div>
          <div class='sign-label'>Name of Seller</div>
          <br>
          <div>${sellerSignHTML}</div>
          <br>
          <div class='sign-name'>${order.admin?.name || "N/A"}</div>
          <br>
          <div>Date: ${order.contract.signedBySellerAt ? order.contract.signedBySellerAt.toLocaleDateString() : "__________"}</div>
        </div>
        <div>
          <div class='sign-label'>Name of Buyer</div>
          <br>
          <div>${buyerSignHTML}</div>
          <br>
          <div class='sign-name'>${buyer?.fullName || ""}</div>
          <br>
          <div>Date: ${order.contract.signedByBuyerAt ? order.contract.signedByBuyerAt.toLocaleDateString() : "__________"}</div>
        </div>
      </div>
      </div></body></html>`;

    // Render PDF
    let pdfBuffer;
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(contractHTML, { waitUntil: "networkidle0" });
      pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      await browser.close();
    } catch (err) {
      return res.status(500).json({ message: "Failed to generate PDF", error: err });
    }

    // Upload PDF
    const pdfUrl = await uploadToCloudinary({ buffer: pdfBuffer });
    order.contract.url = pdfUrl;

    await order.save();

    res.json({
      message: "Seller signed contract successfully, contract updated",
      contract: order.contract,
    });
  } catch (error) {
    console.error("Error in signContractSeller:", error);
    res.status(500).json({ message: "Server error (seller)", error: error?.message, stack: error?.stack });
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

    // Puppeteer ES6 render HTML table
    const customer = order.customerInfo;
    const car = order.carInfo;
    const contractDate = new Date().toLocaleDateString();
    const contractHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; font-size: 14px; background: #fff; color: #222; margin: 0; }
  .contract-container { max-width: 700px; margin: 30px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 32px 36px 28px 36px; border: 1px solid #e3e3e3; }
  h2 { text-align: center; font-size: 1.5rem; color: #222; margin-bottom: 18px; font-weight: bold; }
  .contract-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  .contract-table td { padding: 6px 8px; vertical-align: top; }
  .contract-table .label { font-weight: bold; width: 160px; }
  .contract-table .value { width: 70%; }
  .section-title { font-weight: bold; margin-top: 18px; margin-bottom: 8px; font-size: 1.08rem; color: #2a5d9f; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 38px; }
  .sign-block { width: 44%; text-align: center; background: #f3f7fb; border-radius: 8px; border: 1px solid #e3e3e3; padding: 18px 0 12px 0; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .sign-block .label { font-weight: bold; color: #2a5d9f; font-size: 1rem; }
  .sign-block .name { margin-top: 16px; font-weight: bold; font-size: 1.1rem; color: #333; letter-spacing: 1px; }
  .sign-footer { margin-top: 40px; display: flex; justify-content: space-between; }
  .sign-footer .sign-label { font-weight: bold; }
  .sign-footer .sign-name { margin-top: 32px; min-width: 180px; border-bottom: 1px solid #222; display: inline-block; }
  </style>
  </head>
  <body>
  <div class="contract-container">
  <h2>CAR SALE AGREEMENT</h2>
  <table class="contract-table">
  <tr>
  <td class="label">Seller:</td>
  <td class="value">${order.admin?.name || ""}</td>
  </tr>
  <tr>
  <td class="label">Buyer:</td>
  <td class="value">${customer?.fullName || ""}</td>
  </tr><tr><td class="label">Vehicle:</td>
  <td class="value">${car?.title || ""} (${car?.brandId?.name || ""}, ${car?.model || ""})</td>
  </tr>
  <tr>
  <td class="label">Vehicle Identification Number:</td>
  <td class="value">${car?.vin || "__________"}</td>
  </tr>
  </table>
  <div class="section-title">Terms:</div>
  <ol style="margin-left:18px;">
  <li>The date of the sale of the Vehicle will be <b>${contractDate}</b>.</li>
  <li>The total purchase price of the Vehicle will be <b>${order.totalPrice ? `$${order.totalPrice.toFixed(2)}` : "__________"}</b> Dollars </li>
  <li>In exchange for the Vehicle, the Buyer will pay Seller the total purchase price of the Vehicle on the day of the sale by cashier’s check, money order, or cash.</li>
  <li>Upon receipt of payment as provided above, The Seller agrees to provide the following documents to Buyer on the sale date:<br>
  &bull; Certificate of Title (including Odometer Disclosure Section), signed by Seller.<br>&bull; 
  The current registration for the Vehicle.</li><li>The Seller agrees to deliver the Vehicle to Buyer with a current 
  registration and a clear title. Seller warrants that Seller is the legal owner of the Vehicle and that the Vehicle is free of all legal claims, liens, and encumbrances. The Seller agrees
   to pay for and deliver any necessary smog certification to Buyer before the sale date.</li>
   <li>The Vehicle is sold "as is," and the Seller makes no express or implied warranties as to the condition or performance of the Vehicle,
    except as follows: to the best of Seller’s knowledge, this vehicle:<br><input type="checkbox"> is <input type="checkbox"> is not a salvage vehicle.<br><input type="checkbox"> has <input type="checkbox"> has not been declared a total loss by an insurance company.
    <br><input type="checkbox"> has <input type="checkbox">
     has not been repaired pursuant to a Lemon Law.</li><li>The Buyer agrees to register the Vehicle in his/her name with the California Department of Motor Vehicles within one week of the date of the sale.</li>
     </ol>
     <div class="sign-footer">
     <div>
     <div class="sign-label">Name of Seller</div>
     <div class="sign-name">${order.admin?.name || ""}</div>
     <div>Date: ____________</div></div><div><div class="sign-label">Name of Buyer</div>
     <div class="sign-name">${customer?.fullName || ""}</div><div>Date: ____________</div>
     </div></div></div></body></html>`;

    // Render HTML thành PDF bằng puppeteer
    let pdfBuffer;
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(contractHTML, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
    } catch (err) {
      return res.status(500).json({ message: 'Failed to generate PDF', error: err });
    }

    // Upload PDF lên Cloudinary
    const pdfUrl = await uploadToCloudinary({ buffer: pdfBuffer });

order.contract = {
  url: pdfUrl,
  signedBySeller: false,
  signedBySellerName: null,
  signedBySellerAt: null,
  signatureImageBySeller: null, // đúng với schema
  signedByBuyer: false,
  signedByBuyerName: null,
  signedByBuyerAt: null,
  signatureImageByBuyer: null,  // đúng với schema
  signed: false,
};

    await order.save();

    res.json({
      message: "Contract created successfully (unsigned)",
      contractUrl: pdfUrl,
      contract: order.contract,
    });
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
// ====== HÀM KÝ HỢP ĐỒNG BÊN BUYER ======
export const signContractBuyer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { signatureImage } = req.body;

    const order = await Order.findById(orderId)
      .populate({ path: "carInfo", populate: { path: "brandId", select: "name" } })
      .populate("admin", "name phone email")
      .populate("customerId");

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.admin) order.admin = { name: "N/A" };

    // Check customer
    let orderCustomerId = order.customerId?._id || order.customerId;
    if (!req.customer || String(req.customer._id) !== String(orderCustomerId)) {
      return res.status(403).json({ message: "Forbidden: Only the order's customer can sign this contract" });
    }

    if (!order.contract) order.contract = {};
    order.contract.signedByBuyer = true;
    order.contract.signedByBuyerName = order.customerId?.fullName || "";
    order.contract.signedByBuyerAt = new Date();
    if (signatureImage) order.contract.signatureImageByBuyer = signatureImage;

    // Cập nhật trạng thái contract + order
    computeContractStatus(order.contract);
    computeOrderStatus(order);

    const buyer = order.customerId;
    const car = order.carInfo;
    const contractDate = new Date().toLocaleDateString();

    // Helper render chữ ký
    const renderSignature = (sig) => {
      if (!sig) return `<div style='font-style:italic;color:#888;'>Not Signed</div>`;
      const isImage = typeof sig === "string" && (sig.startsWith("data:image") || sig.startsWith("http"));
      return isImage
        ? `<img src='${sig}' alt='Signature' style='max-width:180px;max-height:60px;display:block;margin:0 auto;' />`
        : `<div style='font-family:monospace;font-size:1.1rem;color:#222;margin-top:4px;'>${sig}</div>`;
    };

    const sellerSignHTML = renderSignature(order.contract.signatureImageBySeller);
    const buyerSignHTML = renderSignature(order.contract.signatureImageByBuyer);

    // HTML hợp đồng
    const contractHTML = `<!DOCTYPE html><html><head><meta charset='utf-8'><style>
      body { font-family: Arial, sans-serif; font-size: 14px; background: #fff; color: #222; margin: 0; }
      .contract-container { max-width: 700px; margin: 30px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 32px 36px 28px 36px; border: 1px solid #e3e3e3; }
      h2 { text-align: center; font-size: 1.5rem; color: #222; margin-bottom: 18px; font-weight: bold; }
      .contract-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
      .contract-table td { padding: 6px 8px; vertical-align: top; }
      .contract-table .label { font-weight: bold; width: 160px; }
      .contract-table .value { width: 70%; }
      .section-title { font-weight: bold; margin-top: 18px; margin-bottom: 8px; font-size: 1.08rem; color: #2a5d9f; }
      .sign-footer { margin-top: 40px; display: flex; justify-content: space-between; }
      .sign-footer .sign-label { font-weight: bold; }
      .sign-footer .sign-name { margin-top: 32px; min-width: 180px; border-bottom: 1px solid #222; display: inline-block; }
      </style></head><body>
      <div class='contract-container'>
      <h2>CAR SALE AGREEMENT</h2>
      <table class='contract-table'>
        <tr><td class='label'>Seller:</td><td class='value'>${order.admin?.name || "N/A"}</td></tr>
        <tr><td class='label'>Buyer:</td><td class='value'>${buyer?.fullName || ""}</td></tr>
        <tr><td class='label'>Vehicle:</td><td class='value'>${car?.title || ""} (${car?.brandId?.name || ""}, ${car?.model || ""})</td></tr>
        <tr><td class='label'>Vehicle Identification Number:</td><td class='value'>${car?.vin || "__________"}</td></tr>
      </table>
      <div class='section-title'>Terms:</div>
      <ol style='margin-left:18px;'>
        <li>The date of the sale of the Vehicle will be <b>${contractDate}</b>.</li>
        <li>The total purchase price of the Vehicle will be <b>${order.totalPrice ? `$${order.totalPrice.toFixed(2)}` : "__________"}</b> Dollars </li>
        <li>In exchange for the Vehicle, the Buyer will pay Seller the total purchase price of the Vehicle on the day of the sale by cashier’s check, money order, or cash.</li>
        <li>Upon receipt of payment as provided above, The Seller agrees to provide the following documents to Buyer on the sale date:<br>&bull; Certificate of Title (including Odometer Disclosure Section), signed by Seller.<br>&bull; The current registration for the Vehicle.</li>
        <li>The Seller agrees to deliver the Vehicle to Buyer with a current registration and a clear title. Seller warrants that Seller is the legal owner of the Vehicle and that the Vehicle is free of all legal claims, liens, and encumbrances. The Seller agrees to pay for and deliver any necessary smog certification to Buyer before the sale date.</li>
        <li>The Vehicle is sold "as is," and the Seller makes no express or implied warranties as to the condition or performance of the Vehicle, except as follows: to the best of Seller’s knowledge, this vehicle:<br><input type='checkbox'> is <input type='checkbox'> is not a salvage vehicle.<br><input type='checkbox'> has <input type='checkbox'> has not been declared a total loss by an insurance company.<br><input type='checkbox'> has <input type='checkbox'> has not been repaired pursuant to a Lemon Law.</li>
        <li>The Buyer agrees to register the Vehicle in his/her name with the California Department of Motor Vehicles within one week of the date of the sale.</li>
      </ol>
      <div class='sign-footer'>
        <div>
          <div class='sign-label'>Name of Seller</div>
          <br>
          <div>${sellerSignHTML}</div>
          <br>
          <div class='sign-name'>${order.admin?.name || "N/A"}</div>
          <br>
          <div>Date: ${order.contract.signedBySellerAt ? order.contract.signedBySellerAt.toLocaleDateString() : "__________"}</div>
        </div>
        <div>
          <div class='sign-label'>Name of Buyer</div>
          <br>
          <div>${buyerSignHTML}</div>
          <br>
          <div class='sign-name'>${buyer?.fullName || ""}</div>
          <br>
          <div>Date: ${order.contract.signedByBuyerAt ? order.contract.signedByBuyerAt.toLocaleDateString() : "__________"}</div>
        </div>
      </div>
      </div></body></html>`;

    // Render PDF
    let pdfBuffer;
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(contractHTML, { waitUntil: "networkidle0" });
      pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      await browser.close();
    } catch (err) {
      return res.status(500).json({ message: "Failed to generate PDF", error: err });
    }

    // Upload PDF
    const pdfUrl = await uploadToCloudinary({ buffer: pdfBuffer });
    order.contract.url = pdfUrl;

    await order.save();

    res.json({
      message: "Buyer signed contract successfully, contract updated",
      contract: order.contract,
    });
  } catch (error) {
    console.error("Error in signContractBuyer:", error);
    res.status(500).json({ message: "Server error (buyer)", error: error?.message, stack: error?.stack });
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