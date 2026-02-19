export type Institute = {
  id: string;
  name: string;
  owner_user_id: string;
  phone: string;
  city: string;
  created_at: string;
};

export type Student = {
  id: string;
  institute_id: string;
  student_name: string;
  parent_name: string;
  parent_phone: string;
  monthly_fee: number;
  fee_due_day: number;
  created_at: string;
};

export type Payment = {
  id: string;
  institute_id: string;
  student_id: string;
  amount: number;
  payment_link_id: string | null;
  status: "pending" | "paid";
  paid_at: string | null;
  created_at: string;
};

export type DashboardStats = {
  totalStudents: number;
  paidThisMonth: number;
  unpaidThisMonth: number;
  outstandingAmount: number;
};
