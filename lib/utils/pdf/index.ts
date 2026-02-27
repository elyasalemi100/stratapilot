import React from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "./invoice-pdf";

export async function generateInvoicePdf(data: {
  ocName: string;
  ocPlanNumber: string;
  ocAddress?: string;
  invoiceNumber: string;
  dueDate: string;
  lotNumber: string;
  unitAddress?: string;
  ownerName: string;
  ownerAddress?: string;
  lineItems: { description: string; amount: number }[];
  totalAmount: number;
  bankDetails?: { bsb: string; account: string; name: string };
}): Promise<Buffer> {
  const doc = React.createElement(InvoicePdfDocument, data) as React.ReactElement;
  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export { InvoicePdfDocument };
