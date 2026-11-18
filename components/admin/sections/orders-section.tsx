"use client"

import React, { useCallback, useEffect, useState } from 'react'
import {
    RiCheckboxCircleLine,
    RiEditLine,
    RiRefreshLine,
    RiTruckLine,
} from '@remixicon/react'
import { Button } from '@/components/base/buttons/button'
import { Chip, type ChipColor } from '@/components/base/badges/chip'
import { Divider } from '@/components/base/divider/divider'
import { Input } from '@/components/base/input/input'
import { SearchField } from '@/components/base/search-field/search-field'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { Tab, TabList, Tabs } from '@/components/base/tabs/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PaginationComponent } from '@/components/PaginationComponent'
import { useToast } from '@/hooks/use-toast'
import { adminFetch, formatRupiah, type AdminOrder } from '@/lib/admin-api'

const ORDER_TABS = [
    { key: 'all', label: 'Semua' },
    { key: 'pending', label: 'Belum Bayar' },
    { key: 'proses', label: 'Diproses' },
    { key: 'sent', label: 'Dikirim' },
    { key: 'complete', label: 'Selesai' },
    { key: 'expired', label: 'Kadaluarsa' },
]

const STATUS_META: Record<string, { label: string; color: ChipColor }> = {
    pending: { label: 'Belum Bayar', color: 'yellow' },
    proses: { label: 'Diproses', color: 'blue' },
    sent: { label: 'Dikirim', color: 'cyan' },
    complete: { label: 'Selesai', color: 'lime' },
    expired: { label: 'Kadaluarsa', color: 'neutral' },
}

export function OrdersSection({
    onUnauthorized,
    onOrdersChanged,
}: {
    onUnauthorized: () => void
    onOrdersChanged?: () => void
}) {
    const { toast } = useToast()
    const [status, setStatus] = useState('all')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [orders, setOrders] = useState<AdminOrder[]>([])
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [loading, setLoading] = useState(true)

    const [editing, setEditing] = useState<AdminOrder | null>(null)
    const [nextStatus, setNextStatus] = useState('proses')
    const [courierName, setCourierName] = useState('')
    const [trackingNumber, setTrackingNumber] = useState('')
    const [saving, setSaving] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                status,
                page: String(page),
                limit: '15',
            })
            if (search.trim()) params.set('search', search.trim())
            const res = await adminFetch<{ orders: AdminOrder[]; total: number; totalPage: number }>(
                `/admin/orders?${params.toString()}`
            )
            setOrders(res.orders || [])
            setTotal(res.total || 0)
            setTotalPages(res.totalPage || 0)
        } catch (err: unknown) {
            if ((err as { status?: number })?.status === 401) {
                onUnauthorized()
                return
            }
            toast({
                title: 'Gagal memuat pesanan',
                description: err instanceof Error ? err.message : 'Terjadi kesalahan',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }, [status, page, search, onUnauthorized, toast])

    useEffect(() => {
        const id = setTimeout(() => {
            load()
        }, search ? 250 : 0)
        return () => clearTimeout(id)
    }, [load, search])

    const openManage = (order: AdminOrder) => {
        setEditing(order)
        setNextStatus(order.status)
        setCourierName(order.courierName || '')
        setTrackingNumber(order.trackingNumber || '')
    }

    const handleSaveStatus = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editing) return
        setSaving(true)
        try {
            await adminFetch(`/admin/orders/${encodeURIComponent(editing.invoice)}/status`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: nextStatus,
                    courierName: courierName.trim() || undefined,
                    trackingNumber: trackingNumber.trim() || undefined,
                }),
            })
            toast({ title: `Status ${editing.invoice} diperbarui` })
            setEditing(null)
            load()
            onOrdersChanged?.()
        } catch (err) {
            toast({
                title: 'Gagal memperbarui status',
                description: err instanceof Error ? err.message : 'Terjadi kesalahan',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchField
                    aria-label="Cari invoice, nama pembeli, atau nomor HP"
                    placeholder="Cari invoice, nama pembeli, atau no. HP..."
                    value={search}
                    onChange={(v) => {
                        setSearch(v)
                        setPage(1)
                    }}
                    shape="rounded"
                    className="sm:max-w-sm"
                />
                <Button variant="secondary" size="medium" leadingIcon={RiRefreshLine} onClick={load}>
                    Segarkan ({total})
                </Button>
            </div>

            <Tabs
                selectedKey={status}
                onSelectionChange={(k) => {
                    setStatus(String(k))
                    setPage(1)
                }}
            >
                <TabList aria-label="Filter status pesanan">
                    {ORDER_TABS.map((t) => (
                        <Tab key={t.key} id={t.key}>
                            {t.label}
                        </Tab>
                    ))}
                </TabList>
            </Tabs>

            <section className="overflow-hidden rounded-3xl border border-border-button-default bg-background-full">
                {loading ? (
                    <div className="space-y-3 p-6" aria-busy="true">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} shape="rect" className="h-14 w-full" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-body-medium text-text-primary">Tidak ada pesanan ditemukan</p>
                        <p className="mt-1 text-caption-1-regular text-text-secondary">
                            Pesanan yang dibuat pelanggan di checkout akan langsung muncul di sini.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-body-regular">
                            <thead>
                                <tr className="border-b border-separator-border text-caption-1-semibold text-text-tertiary">
                                    <th className="px-5 py-3.5 text-start">Invoice & Tanggal</th>
                                    <th className="px-4 py-3.5 text-start">Pembeli</th>
                                    <th className="px-4 py-3.5 text-start">Produk & Kirim</th>
                                    <th className="px-4 py-3.5 text-end">Total</th>
                                    <th className="px-4 py-3.5 text-center">Status</th>
                                    <th className="px-5 py-3.5 text-end">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-separator-border">
                                {orders.map((order) => {
                                    const meta = STATUS_META[order.status] || {
                                        label: order.status,
                                        color: 'neutral' as ChipColor,
                                    }
                                    return (
                                        <tr key={order.id} className="hover:bg-background-secondary-hover/60">
                                            <td className="px-5 py-3.5 align-top">
                                                <p className="font-semibold tabular-nums text-text-primary" dir="ltr">
                                                    {order.invoice}
                                                </p>
                                                <p className="text-caption-1-regular text-text-tertiary">
                                                    {new Date(order.createdAt).toLocaleString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5 align-top">
                                                <p className="font-medium text-text-primary">{order.name || '-'}</p>
                                                <p className="text-caption-1-regular tabular-nums text-text-secondary" dir="ltr">
                                                    {order.phone || '-'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5 align-top">
                                                <p className="line-clamp-1 text-text-primary">
                                                    {order.products[0]?.name || '-'}
                                                    {order.products.length > 1 ? ` (+${order.products.length - 1})` : ''}
                                                </p>
                                                <p className="text-caption-1-regular text-text-secondary">
                                                    {order.shipping?.title || '-'}
                                                    {order.trackingNumber ? ` · Resi ${order.trackingNumber}` : ''}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5 text-end align-top font-semibold tabular-nums text-text-primary">
                                                {formatRupiah(order.total)}
                                            </td>
                                            <td className="px-4 py-3.5 text-center align-top">
                                                <Chip variant="caption" color={meta.color}>
                                                    {meta.label}
                                                </Chip>
                                            </td>
                                            <td className="px-5 py-3.5 text-end align-top">
                                                <Button
                                                    variant="secondary"
                                                    size="small"
                                                    leadingIcon={RiEditLine}
                                                    onClick={() => openManage(order)}
                                                >
                                                    Kelola
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {totalPages > 1 && (
                <PaginationComponent
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            )}

            {/* Manage Order Modal */}
            <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent aria-label="Kelola pesanan">
                    {editing && (
                        <form onSubmit={handleSaveStatus} className="space-y-5">
                            <DialogHeader>
                                <DialogTitle className="tabular-nums" dir="ltr">
                                    {editing.invoice}
                                </DialogTitle>
                                <DialogDescription>
                                    Pembeli: {editing.name || '-'} ({editing.phone || '-'})
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-2 rounded-2xl bg-background-secondary-default p-4 text-body-regular">
                                <p className="text-caption-1-semibold text-text-tertiary">Produk ({editing.products.length})</p>
                                <ul className="space-y-1.5">
                                    {editing.products.map((p, idx) => (
                                        <li key={idx} className="flex justify-between gap-3">
                                            <span className="text-text-primary">
                                                {p.name} × {p.qty}
                                            </span>
                                            <span className="shrink-0 font-medium tabular-nums text-text-primary">
                                                {formatRupiah(Number(p.price) * p.qty)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <Divider className="my-2" />
                                <div className="flex justify-between font-semibold text-text-primary">
                                    <span>Total Pembayaran</span>
                                    <span className="tabular-nums">{formatRupiah(editing.total)}</span>
                                </div>
                                {editing.address && (
                                    <p className="pt-1 text-caption-1-regular text-text-secondary">
                                        Alamat: {editing.address}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1.5 block text-body-medium text-text-primary">
                                        Ubah Status Pesanan
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {ORDER_TABS.filter((t) => t.key !== 'all').map((t) => (
                                            <button
                                                key={t.key}
                                                type="button"
                                                onClick={() => setNextStatus(t.key)}
                                                className={`rounded-xl border px-3 py-2 text-body-medium transition-colors ${
                                                    nextStatus === t.key
                                                        ? 'border-accent-600 bg-accent-50 text-accent-600'
                                                        : 'border-border-button-default bg-background-full text-text-secondary hover:bg-background-secondary-hover'
                                                }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {editing.shipping?.title !== 'Ambil di Toko' && (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Input
                                            label="Nama Kurir"
                                            placeholder="mis. J&T Express"
                                            value={courierName}
                                            onChange={setCourierName}
                                        />
                                        <Input
                                            label="Nomor Resi (opsional)"
                                            placeholder="Otomatis jika dikosongkan"
                                            value={trackingNumber}
                                            onChange={setTrackingNumber}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setEditing(null)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    leadingIcon={nextStatus === 'sent' ? RiTruckLine : RiCheckboxCircleLine}
                                    disabled={saving}
                                >
                                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
