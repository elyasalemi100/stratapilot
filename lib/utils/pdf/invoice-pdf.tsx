import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  col1: { width: "40%" },
  col2: { width: "20%" },
  col3: { width: "20%" },
  col4: { width: "20%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#111",
    fontSize: 12,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#6b7280",
    textAlign: "center",
  },
});

interface InvoicePdfProps {
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
}

export function InvoicePdfDocument({
  ocName,
  ocPlanNumber,
  ocAddress,
  invoiceNumber,
  dueDate,
  lotNumber,
  unitAddress,
  ownerName,
  ownerAddress,
  lineItems,
  totalAmount,
  bankDetails,
}: InvoicePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Levy Notice</Text>
          <Text style={styles.subtitle}>
            {ocName} • Plan {ocPlanNumber}
          </Text>
          {ocAddress && (
            <Text style={styles.subtitle}>{ocAddress}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <View style={styles.row}>
            <Text>Invoice Number:</Text>
            <Text>{invoiceNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text>Due Date:</Text>
            <Text>{formatDate(dueDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text>{ownerName}</Text>
          {ownerAddress && <Text>{ownerAddress}</Text>}
          <Text style={{ marginTop: 4 }}>
            Lot {lotNumber}
            {unitAddress ? ` • ${unitAddress}` : ""}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col4}>Amount</Text>
          </View>
          {lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col4}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text>Total Due: {formatCurrency(totalAmount)}</Text>
        </View>

        {bankDetails && (
          <View style={[styles.section, { marginTop: 30 }]}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <Text>BSB: {bankDetails.bsb}</Text>
            <Text>Account: {bankDetails.account}</Text>
            <Text>Account Name: {bankDetails.name}</Text>
            <Text style={{ marginTop: 8 }}>
              Please use invoice number {invoiceNumber} as reference.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>
            This is an official levy notice from {ocName}. Please pay by the due
            date to avoid interest charges.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
