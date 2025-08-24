export const computeContractStatus = (contract) => {
  if (!contract.signedBySeller && !contract.signedByBuyer) return "pending";
  if (!contract.signedBySeller && contract.signedByBuyer) return "pending_admin";
  if (contract.signedBySeller && !contract.signedByBuyer) return "not_signed";
  if (contract.signedBySeller && contract.signedByBuyer) return "signed";
  return "pending";
};

export const computeOrderStatus = (order) => {
  if (order.paymentStatus === "failed") return "canceled";
  if (order.contract?.status !== "signed" || order.paymentStatus === "pending") return "pending";
  if (order.contract?.status === "signed" && order.paymentStatus === "deposited") return "confirmed";
  if (order.contract?.status === "signed" && order.paymentStatus === "paid") return "paid";
  return "pending";
};