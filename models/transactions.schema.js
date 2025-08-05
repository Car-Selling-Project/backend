import mongoose from "mongoose";
const transactionSchema = new mongoose.Schema({
    orderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required:true
    },
    customerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Customer",
        required:true
    },
    amount:{
        type:Number,
        required:true,
        min:0,
        validate:{
            validator:Number.isInteger,
            message: "🚫 amount must be an integer"
        }
    },
    method:{
        type:String,
        enum:["cash", "bank_transfer", "loan"],
        required:true,
        default: "cash"
    },
    type:{
        type:String,
        enum:["deposit", "full_payment"],
        required:true,
        default:"full_payment"
    },
    transactionCode:{
        type:String,
        default: ""
    },
    status:{
        type: String,
        enum: ["success", "failed", "pending"],
        default: "pending"
    },
    receiptUrl:{
        type: String,
         default: ""
    }
},
{
    timestamps:true
}
);
const Transaction = mongoose.model("Transaction" , transactionSchema);
export default Transaction;
