export type Plan = "pro" | "enterprise";
export type MemberRole = "owner" | "teacher";

export type Institute = {
  id: string;
  name: string;
  owner_user_id: string;
  phone: string;
  city: string;
  plan: Plan;
  created_at: string;
};

export type InstituteMember = {
  id: string;
  institute_id: string;
  user_id: string;
  role: MemberRole;
  name: string;
  subject: string | null;
  created_at: string;
};

export type Student = {
  id: string;
  institute_id: string;
  teacher_id: string | null;
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
  teacher_id: string | null;
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

export type Attendance = {
  id: string;
  institute_id: string;
  teacher_id: string;
  student_id: string;
  date: string;
  status: "present" | "absent";
  created_at: string;
};

export type BatchType = 'group' | 'one_to_one';

export type Batch = {
  id: string;
  institute_id: string;
  teacher_id: string;
  name: string;
  type: BatchType;
  session_fee: number | null;
  created_at: string;
};

export type StudentBatch = {
  id: string;
  student_id: string;
  batch_id: string;
  institute_id: string;
  created_at: string;
};

export type StudentTeacher = {
  id: string;
  student_id: string;
  teacher_id: string;
  institute_id: string;
  monthly_fee: number;
  fee_due_day: number;
  created_at: string;
};
