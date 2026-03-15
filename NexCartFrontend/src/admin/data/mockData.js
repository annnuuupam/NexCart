export const kpis = {
  revenue: 2485600,
  orders: 1248,
  customers: 867,
  products: 214,
};

export const salesSeries = [
  { name: "Mon", daily: 22000, weekly: 98000, monthly: 320000 },
  { name: "Tue", daily: 28000, weekly: 110000, monthly: 350000 },
  { name: "Wed", daily: 24000, weekly: 102000, monthly: 342000 },
  { name: "Thu", daily: 33000, weekly: 124000, monthly: 389000 },
  { name: "Fri", daily: 36000, weekly: 137000, monthly: 421000 },
  { name: "Sat", daily: 43000, weekly: 160000, monthly: 470000 },
  { name: "Sun", daily: 39000, weekly: 151000, monthly: 452000 },
];

export const bestSellingProducts = [
  { id: "P-1001", name: "Noise Cancelling Headphones", sold: 238, revenue: 714000 },
  { id: "P-1002", name: "Smart Fitness Watch", sold: 187, revenue: 561000 },
  { id: "P-1003", name: "Gaming Keyboard RGB", sold: 162, revenue: 243000 },
  { id: "P-1004", name: "Wireless Earbuds Pro", sold: 141, revenue: 423000 },
];

export const lowStockProducts = [
  { id: "P-1005", name: "USB-C Hub 8 in 1", stock: 4 },
  { id: "P-1006", name: "Portable SSD 1TB", stock: 7 },
  { id: "P-1007", name: "Ergonomic Chair", stock: 2 },
];

export const products = [
  {
    id: "P-1001",
    name: "Noise Cancelling Headphones",
    category: "Electronics",
    price: 2999,
    stock: 42,
    status: "Active",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
  },
  {
    id: "P-1002",
    name: "Smart Fitness Watch",
    category: "Wearables",
    price: 3499,
    stock: 28,
    status: "Active",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
  },
  {
    id: "P-1003",
    name: "Gaming Keyboard RGB",
    category: "Accessories",
    price: 1499,
    stock: 11,
    status: "Active",
    image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400",
  },
  {
    id: "P-1004",
    name: "Wireless Earbuds Pro",
    category: "Electronics",
    price: 2499,
    stock: 0,
    status: "Out of Stock",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400",
  },
];

export const categories = [
  { id: "C-1", name: "Electronics", image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400", productCount: 68 },
  { id: "C-2", name: "Wearables", image: "https://images.unsplash.com/photo-1579586337278-3f436f25d4d6?w=400", productCount: 29 },
  { id: "C-3", name: "Accessories", image: "https://images.unsplash.com/photo-1585386959984-a41552231658?w=400", productCount: 52 },
];

export const orders = [
  {
    id: "ORD-9001",
    customerName: "Amit Kumar",
    products: ["Noise Cancelling Headphones", "USB-C Hub 8 in 1"],
    totalAmount: 4398,
    status: "Pending",
    createdAt: "2026-03-09T10:15:00.000Z",
  },
  {
    id: "ORD-9002",
    customerName: "Riya Sharma",
    products: ["Smart Fitness Watch"],
    totalAmount: 3499,
    status: "Shipped",
    createdAt: "2026-03-08T08:21:00.000Z",
  },
  {
    id: "ORD-9003",
    customerName: "Farhan Ali",
    products: ["Gaming Keyboard RGB", "Wireless Earbuds Pro"],
    totalAmount: 3998,
    status: "Delivered",
    createdAt: "2026-03-07T14:40:00.000Z",
  },
];

export const customers = [
  { id: "U-101", name: "Amit Kumar", email: "amit@example.com", phone: "+91 9876543210", totalOrders: 18, totalSpending: 42500, blocked: false },
  { id: "U-102", name: "Riya Sharma", email: "riya@example.com", phone: "+91 9001122334", totalOrders: 11, totalSpending: 28700, blocked: false },
  { id: "U-103", name: "Farhan Ali", email: "farhan@example.com", phone: "+91 9898989898", totalOrders: 6, totalSpending: 12300, blocked: true },
];

export const coupons = [
  { id: "CPN-01", code: "NEX10", discountType: "Percentage", discountValue: 10, expiryDate: "2026-04-30", usageLimit: 500 },
  { id: "CPN-02", code: "SAVE300", discountType: "Flat", discountValue: 300, expiryDate: "2026-03-31", usageLimit: 300 },
];

export const customerGrowth = [
  { month: "Jan", customers: 120 },
  { month: "Feb", customers: 156 },
  { month: "Mar", customers: 201 },
  { month: "Apr", customers: 238 },
  { month: "May", customers: 292 },
  { month: "Jun", customers: 341 },
];

export const monthlyRevenue = [
  { month: "Jan", revenue: 352000 },
  { month: "Feb", revenue: 421000 },
  { month: "Mar", revenue: 468000 },
  { month: "Apr", revenue: 512000 },
  { month: "May", revenue: 596000 },
  { month: "Jun", revenue: 637000 },
];

export const recentOrders = orders;
