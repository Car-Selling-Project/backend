import Transaction from "../models/transactions.schema.js";
export const getRecentTransactions = async(req , res) => {
    try{
        const transactions = await Transaction.find()
        .sort({createAt : -1})
        .limit(10)
        .populate("order")
        .populate("customerId" , "name")
        .populate("confirmBy" , "name");
        res.status(200).json({
             message: "✅ Recent transactions fetched successfully",
             data:transactions
        });
    }catch(error){
        console.error("❌ Error fetching recent transactions:", error);
        res.status(500).json({
            message: "❌ Failed to fetch recent transactions",
        });
    }
}

// CREATE transaction
export const createTransaction = async (req, res) => {
  try {
    const newTransaction = await Transaction.create(req.body);

    const populated = await Transaction.findById(newTransaction._id)
      .populate("order")
      .populate("customerId", "name")
      .populate("confirmBy", "name");

    res.status(201).json({
      message: "✅ Transaction created successfully",
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to create transaction",
      error: error.message
    });
  }
};

// GET all transactions với filter tùy chọn
export const getAllTransactions = async (req, res) => {
  try {
    const { order, customerId, status, type } = req.query;
    const filter = {};
    if (order) filter.order = order;
    if (customerId) filter.customerId = customerId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .populate("order")               // populate theo trường mới
      .populate("customerId", "name")
      .populate("confirmBy", "name");

    res.status(200).json({
      message: "✅ Transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    res.status(500).json({
      message: "❌ Failed to fetch transactions",
      error: error.message,
    });
  }
};

// GET transaction by ID
export const getTransactionById = async (req, res) => {
  const { id } = req.params;
  try {
    const transaction = await Transaction.findById(id)
      .populate("order")
      .populate("customerId", "name")
      .populate("confirmBy", "name");

    if (!transaction) {
      return res.status(404).json({ message: "❌ Transaction not found" });
    }

    res.status(200).json({
      message: "✅ Transaction fetched successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("❌ Error fetching transaction:", error);
    res.status(500).json({
      message: "❌ Failed to fetch transaction",
      error: error.message,
    });
  }
};

// UPDATE transaction by ID
export const updateTransactionById = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("order")
      .populate("customerId", "name")
      .populate("confirmBy", "name");

    if (!updatedTransaction) {
      return res.status(404).json({ message: "❌ Transaction not found" });
    }

    res.status(200).json({
      message: "✅ Transaction updated successfully",
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("❌ Error updating transaction:", error);
    res.status(500).json({
      message: "❌ Failed to update transaction",
      error: error.message,
    });
  }
};

// DELETE transaction by ID
export const deleteTransactionById = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Transaction.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "❌ Transaction not found" });
    }
    res.status(200).json({ message: "✅ Transaction deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting transaction:", error);
    res.status(500).json({
      message: "❌ Failed to delete transaction",
      error: error.message,
    });
  }
};
