export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | "platform_super_admin"
  | "management_admin"
  | "strata_manager"
  | "committee_member"
  | "lot_owner"
  | "read_only_auditor";

export type OccupancyType = "owner" | "tenant";
export type CommitteePosition = "chair" | "secretary" | "treasurer" | "member";
export type FundType = "admin" | "capital_works";
export type TransactionType = "debit" | "credit";
export type InvoiceStatus =
  | "draft"
  | "issued"
  | "paid"
  | "partially_paid"
  | "overdue"
  | "cancelled";
export type PaymentStatus = "pending" | "completed" | "failed" | "reversed";
export type MeetingType = "agm" | "egm" | "committee";
export type DocumentFolder =
  | "financial"
  | "meetings"
  | "compliance"
  | "contracts"
  | "general";
export type EmailStatus = "pending" | "sent" | "delivered" | "bounced" | "failed";

export interface Oc {
  id: string;
  management_company_id: string;
  name: string;
  plan_number: string;
  address: string | null;
  abn: string | null;
  gst_registered: boolean;
  management_start_date: string | null;
  management_end_date: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
}

export interface Lot {
  id: string;
  oc_id: string;
  subdivision_id: string | null;
  lot_number: string;
  unit_address: string | null;
  entitlements: number;
  liabilities: number;
  parking: string | null;
  storage: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Invoice {
  id: string;
  oc_id: string;
  levy_run_id: string | null;
  lot_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
