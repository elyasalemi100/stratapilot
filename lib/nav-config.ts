import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  Vote,
  Receipt,
  FileText,
  AlertCircle,
  Landmark,
  ArrowLeftRight,
  CheckSquare,
  BarChart3,
  Calendar,
  FileStack,
  Mail,
  Shield,
  Settings,
  Wrench,
  CreditCard,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "dashboard", icon: LayoutDashboard },
      { title: "Quick Actions", href: "quick-actions", icon: BarChart3 },
    ],
  },
  {
    title: "Portfolio",
    items: [
      { title: "All OCs", href: "portfolio", icon: Building2 },
      { title: "OC Profile", href: "profile", icon: FileText },
    ],
  },
  {
    title: "Lots & Memberships",
    items: [
      { title: "Lots", href: "lots", icon: Home },
      { title: "Owners & Occupants", href: "owners", icon: Users },
      { title: "Committee", href: "committee", icon: Vote },
    ],
  },
  {
    title: "Levies",
    items: [
      { title: "Levy Runs", href: "levies/runs", icon: FileText, badge: "drafts" },
      { title: "Invoices", href: "levies/invoices", icon: Receipt },
      { title: "Arrears", href: "levies/arrears", icon: AlertCircle, badge: "count" },
    ],
  },
  {
    title: "Banking & Reconciliation",
    items: [
      { title: "Bank Accounts", href: "banking/accounts", icon: Landmark },
      { title: "Transactions", href: "banking/transactions", icon: ArrowLeftRight },
      { title: "Reconciliation", href: "banking/reconciliation", icon: CheckSquare, badge: "unreconciled" },
    ],
  },
  {
    title: "Reports",
    items: [
      { title: "Financial Reports", href: "reports/financial", icon: BarChart3 },
      { title: "Levy Reports", href: "reports/levies", icon: Receipt },
      { title: "Arrears Report", href: "reports/arrears", icon: AlertCircle },
    ],
  },
  {
    title: "Meetings",
    items: [
      { title: "Meeting Register", href: "meetings", icon: Calendar },
      { title: "Upcoming Meetings", href: "meetings/upcoming", icon: Calendar },
    ],
  },
  {
    title: "Documents",
    items: [
      { title: "Document Library", href: "documents", icon: FileStack },
      { title: "Share Links", href: "documents/links", icon: FileText },
    ],
  },
  {
    title: "Communications",
    items: [
      { title: "Email Templates", href: "communications/templates", icon: Mail },
      { title: "Comms Log", href: "communications/log", icon: FileText },
    ],
  },
  {
    title: "Compliance",
    items: [
      { title: "Audit Log", href: "compliance/audit", icon: Shield },
      { title: "Approvals", href: "compliance/approvals", icon: CheckSquare },
      { title: "Data Export", href: "compliance/export", icon: FileText },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "OC Settings", href: "settings", icon: Settings },
      { title: "Billing", href: "settings/billing", icon: CreditCard },
      { title: "Financial Setup", href: "settings/financial", icon: Landmark },
      { title: "Users & Permissions", href: "settings/users", icon: Users },
    ],
  },
  {
    title: "Admin",
    items: [
      { title: "Management Company", href: "admin/company", icon: Building2 },
      { title: "Platform Settings", href: "admin/platform", icon: Wrench },
    ],
  },
];
