export type Profile = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  balance: number;
  status: "active" | "suspended";
  created_at: string;
};

export type Category = {
  id: string;
  platform: string;
  name: string;
  description: string | null;
  status: "active" | "disabled";
  sort_order: number;
};

export type Service = {
  id: string;
  service_id: string;
  platform: string;
  category_id: string;
  name: string;
  description: string | null;
  rate_per_1000: number;
  min_quantity: number;
  max_quantity: number;
  speed: string | null;
  start_time: string | null;
  refill: string | null;
  status: "active" | "disabled";
  sort_order: number;
  category?: Category;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string;
  service_id: string;
  link: string;
  quantity: number;
  charge: number;
  status: string;
  internal_note: string | null;
  created_at: string;
  service?: Service;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_after: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
};

export type Deposit = {
  id: string;
  user_id: string;
  payment_method_id: string;
  amount: number;
  transaction_id: string;
  status: string;
  created_at: string;
};