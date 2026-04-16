import type {
  ConsultationRow,
  CustomerRow,
  OrderRow,
  ProductRow,
} from '../db/schema';

export function productToFrontend(p: ProductRow) {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price),
    stock: p.stock,
    description: p.description,
    longDescription: p.longDescription ?? '',
    category: p.category,
    status: p.status,
    brand: p.brand ?? '',
    images: Array.isArray(p.images) ? p.images : [],
    specifications:
      p.specifications && typeof p.specifications === 'object' && !Array.isArray(p.specifications)
        ? p.specifications
        : {},
    attachments: Array.isArray(p.attachments) ? p.attachments : [],
  };
}

function coerceMoney(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  if (v != null && typeof v === 'object' && 'toString' in (v as object)) {
    const n = Number(String(v));
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function coerceIsoTimestamp(v: unknown): string {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  // Prefer a stable but clearly "unknown" value over throwing.
  // Returning epoch keeps the API contract (`string`) without crashing routes.
  return new Date(0).toISOString();
}

export function orderToFrontend(o: OrderRow) {
  return {
    id: o.id,
    customer_name: o.customerName,
    customer_phone: o.customerPhone,
    customer_email: o.customerEmail,
    city: o.city,
    address: o.address,
    notes: o.notes,
    payment_method: o.paymentMethod,
    total_price: coerceMoney(o.totalPrice as unknown),
    products: Array.isArray(o.products) ? o.products : [],
    payment_status: o.paymentStatus,
    order_status: o.orderStatus,
    created_at: coerceIsoTimestamp(o.createdAt as unknown),
  };
}

export function customerToFrontend(c: CustomerRow) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    city: c.city,
    created_at: coerceIsoTimestamp(c.createdAt as unknown),
  };
}

export function consultationToFrontend(c: ConsultationRow) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    city: c.city,
    monthly_bill: c.monthlyBill,
    message: c.message,
    status: c.status,
    created_at: coerceIsoTimestamp(c.createdAt as unknown),
  };
}
