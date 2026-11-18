import type { Order } from './order-utils'

const ADMIN_TOKEN_KEY = 'topsell_admin_token'

export function getAdminToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_TOKEN_KEY, token)
    }
}

export function clearAdminToken() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(ADMIN_TOKEN_KEY)
    }
}

export async function adminFetch<T>(
    path: string,
    options: RequestInit = {},
    tokenOverride?: string
): Promise<T> {
    const token = tokenOverride ?? getAdminToken()
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> | undefined),
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    const res = await fetch(`/backend${path}`, {
        ...options,
        headers,
        cache: 'no-store',
    })

    const body = await res.json().catch(() => null)
    if (!res.ok) {
        const err = new Error(body?.message || `Permintaan gagal (${res.status})`) as Error & {
            status?: number
        }
        err.status = res.status
        throw err
    }

    return (body?.data ?? body) as T
}

export interface AdminOverview {
    metrics: {
        totalOrders: number
        totalRevenue: number
        pendingOrders: number
        activeOrders: number
        completedOrders: number
        expiredOrders: number
        totalUsers: number
        totalPoints: number
    }
    chart: { label: string; orders: number; revenue: number }[]
    recentOrders: (Order & { name?: string; phone?: string })[]
}

export interface AdminOrder extends Order {
    name?: string
    email?: string
    phone?: string
}

export interface AdminVoucher {
    id: string
    name: string
    type: 'fixed' | 'percent' | 'shipping'
    description: string
    minTransaction: number
    discount: number
    maxDiscount: number
    fulfillmentType: 'all' | 'delivery' | 'pickup'
    qty: number
    usedQty: number
    isAutoApply: boolean
    isActive: boolean
    startDate?: string
    endDate?: string
}

export interface AdminPointCatalogItem {
    id: string
    name: string
    pointCost: number
    discountValue: number
    minTransaction: number
    validityDays: number
    isActive: boolean
}

export interface AdminUser {
    id: string
    fullName: string
    phoneNumber: string
    email: string
    isEmailValid: boolean
    points: number
    orderCount: number
    totalSpent: number
    createdAt: string
}

export interface AdminPostalCode {
    id: string
    prefixOrCode: string
    city: string
    province: string
    isActive: boolean
}

export interface AdminStore {
    id: string
    name: string
    address: string
    areaName: string
    isActive: boolean
}

export interface AdminPaymentMethod {
    id: string
    groupKey: string
    groupName: string
    key: string
    name: string
    adminFee: number
    adminFeeType: 'fixed' | 'percentage'
    isActive: boolean
    sortOrder: number
}

export interface AdminWebhook {
    id: string
    name: string
    url: string
    events: string[]
    secret: string
    isActive: boolean
    lastTriggeredAt: string | null
}

export interface StoreAreaItem {
    id: string
    name: string
    city: string
    province: string
    active: boolean
}

export interface AdminSettings {
    app_settings?: {
        store_name?: string
        support_whatsapp?: string
        point_to_rupiah?: number
        new_member_points?: number
        banner_imager?: string[]
        meta_your_pixel?: string
        body_script?: string
    }
    store_areas?: StoreAreaItem[]
}

export const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(n || 0)
