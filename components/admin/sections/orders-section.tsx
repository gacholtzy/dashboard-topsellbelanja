"use client"

import React, { useCallback, useEffect, useState } from 'react'
import {
    RiCheckboxCircleLine,
    RiDeleteBinLine,
    RiEditLine,
    RiRefreshLine,
    RiTruckLine,
} from '@remixicon/react'
import { Button } from '@/components/base/buttons/button'
import { Checkbox } from '@/components/base/checkbox/checkbox'
import { BulkActionBar, ConfirmDialog, type BulkResult } from '@/components/admin/bulk-actions'
import { Chip, type ChipColor } from '@/components/base/badges/chip'
import { Input } from '@/components/base/input/input'
import { SearchField } from '@/components/base/search-field/search-field'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { Tab, TabList, Tabs } from '@/components/base/tabs/tabs'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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

function DetailRow({
    label,
    children,
    strong,
}: {
    label: string
    children: React.ReactNode
    strong?: boolean
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-0.5">
            <dt className="shrink-0 text-text-secondary">{label}</dt>
            <dd className={`min-w-0 text-end text-text-primary ${strong ? 'font-semibold' : ''}`}>{children}</dd>
        </div>
    )
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

    // Aksi massal
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [bulkStatus, setBulkStatus] = useState('proses')
    const [bulkBusy, setBulkBusy] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    // Pilihan hanya berlaku untuk daftar yang sedang tampil.
    useEffect(() => {
        setSelected(new Set())
    }, [status, page, search])

    const allSelected = orders.length > 0 && orders.every((o) => selected.has(o.invoice))
    const someSelected = selected.size > 0 && !allSelected

    const toggleAll = (checked: boolean) =>
        setSelected(checked ? new Set(orders.map((o) => o.invoice)) : new Set())

    const toggleOne = (invoice: string, checked: boolean) =>
        setSelected((prev) => {
            const next = new Set(prev)
            if (checked) next.add(invoice)
            else next.delete(invoice)
            return next
        })

    const runBulk = async (body: Record<string, unknown>, doneTitle: string) => {
        setBulkBusy(true)
        try {
            const res = await adminFetch<BulkResult>('/admin/orders/bulk', {
                method: 'POST',
                body: JSON.stringify({ invoices: [...selected], ...body }),
            })
            const failedCount = res.failed?.length ?? 0
            toast({
                title: `${doneTitle}: ${res.affected} pesanan`,
                description: failedCount
                    ? `${failedCount} gagal: ${res.failed.map((f) => `${f.invoice} (${f.message})`).join(', ')}`
                    : undefined,
                variant: failedCount ? 'destructive' : undefined,
            })
            setSelected(new Set())
            setConfirmDelete(false)
            load()
            onOrdersChanged?.()
        } catch (err) {
            toast({
                title: 'Aksi massal gagal',
                description: err instanceof Error ? err.message : 'Terjadi kesalahan',
                variant: 'destructive',
            })
        } finally {
            setBulkBusy(false)
        }
    }

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

            <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
                <select
                    aria-label="Status baru untuk pesanan terpilih"
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="h-8 rounded-lg border border-border-button-default bg-background-full px-2 text-body-regular text-text-primary"
                >
                    {ORDER_TABS.filter((t) => t.key !== 'all').map((t) => (
                        <option key={t.key} value={t.key}>
                            {t.label}
                        </option>
                    ))}
                </select>
                <Button
                    variant="primary"
                    size="small"
                    disabled={bulkBusy}
                    onClick={() => runBulk({ action: 'status', status: bulkStatus }, 'Status diubah')}
                >
                    {bulkBusy ? 'Memproses...' : 'Ubah status'}
                </Button>
                <Button
                    variant="danger"
                    size="small"
                    leadingIcon={RiDeleteBinLine}
                    disabled={bulkBusy}
                    onClick={() => setConfirmDelete(true)}
                >
                    Hapus
                </Button>
            </BulkActionBar>

            <ConfirmDialog
                open={confirmDelete}
                title={`Hapus ${selected.size} pesanan?`}
                description="Pesanan yang dipilih dihapus permanen dari database dan tidak bisa dikembalikan. Pesanan yang sudah dikirim ke Biteship tidak ikut dibatalkan di sana."
                confirmLabel="Ya, hapus"
                loading={bulkBusy}
                onConfirm={() => runBulk({ action: 'delete' }, 'Dihapus')}
                onCancel={() => setConfirmDelete(false)}
            />

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
                                    <th className="w-10 ps-5 py-3.5 text-start">
                                        <Checkbox
                                            aria-label="Pilih semua pesanan di halaman ini"
                                            isSelected={allSelected}
                                            isIndeterminate={someSelected}
                                            onChange={toggleAll}
                                        />
                                    </th>
                                    <th className="px-4 py-3.5 text-start">Invoice & Tanggal</th>
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
                                            <td className="w-10 ps-5 py-3.5 align-top">
                                                <Checkbox
                                                    aria-label={`Pilih pesanan ${order.invoice}`}
                                                    isSelected={selected.has(order.invoice)}
                                                    onChange={(checked) => toggleOne(order.invoice, checked)}
                                                />
                                            </td>
                                            <td className="px-4 py-3.5 align-top">
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

            {/* Detail & Manage Order Modal */}
            <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent aria-label="Detail pesanan" size="xl">
                    {editing && (() => {
                        const isPickup = editing.shipping?.title === 'Ambil di Toko'
                        const subtotal = editing.products.reduce((s, p) => s + Number(p.price) * p.qty, 0)
                        const meta = STATUS_META[editing.status] || { label: editing.status, color: 'neutral' as ChipColor }
                        const shippingLabel = isPickup
                            ? `Ambil di Toko${editing.area?.name ? ` - ${editing.area.name}` : ''}`
                            : [
                                  editing.shipping?.title,
                                  [editing.courierName, editing.courierServiceName].filter(Boolean).join(' '),
                              ]
                                  .filter(Boolean)
                                  .join(' · ')

                        return (
                            <form onSubmit={handleSaveStatus} className="space-y-4">
                                <div className="rounded-2xl bg-accent-600 px-4 py-3 text-center text-title-3-semibold text-white">
                                    Detail Pesanan
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Informasi Pesanan */}
                                    <section className="rounded-2xl bg-background-secondary-default p-4 text-body-regular">
                                        <h3 className="mb-3 text-center text-body-medium font-semibold text-text-primary">
                                            Informasi Pesanan
                                        </h3>
                                        <dl className="space-y-0.5">
                                            <DetailRow label="ID Pesanan:">
                                                <span className="break-all tabular-nums" dir="ltr">#{editing.invoice}</span>
                                            </DetailRow>
                                            <DetailRow label="Tanggal Pesanan:">
                                                {new Date(editing.createdAt).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })}
                                            </DetailRow>
                                            <DetailRow label="Status:">
                                                <Chip variant="caption" color={meta.color}>{meta.label}</Chip>
                                            </DetailRow>
                                        </dl>

                                        <dl className="mt-4 space-y-3">
                                            {editing.products.map((p, idx) => (
                                                <div key={idx} className="space-y-0.5">
                                                    <DetailRow label="Produk:">
                                                        {p.name}
                                                        {(p as { variant?: string }).variant
                                                            ? ` - ${(p as { variant?: string }).variant}`
                                                            : ''}
                                                    </DetailRow>
                                                    <DetailRow label="Harga:">
                                                        <span className="tabular-nums">{formatRupiah(Number(p.price))}</span>
                                                    </DetailRow>
                                                    <DetailRow label="Qty:">
                                                        <span className="tabular-nums">{p.qty}</span>
                                                    </DetailRow>
                                                </div>
                                            ))}
                                        </dl>

                                        <dl className="mt-4 space-y-0.5">
                                            <DetailRow label="Nama Pembeli:">{editing.name || '-'}</DetailRow>
                                            <DetailRow label="Alamat:">{isPickup ? '-' : editing.address || '-'}</DetailRow>
                                            <DetailRow label="No. Telefon:">
                                                <span className="tabular-nums" dir="ltr">{editing.phone || '-'}</span>
                                            </DetailRow>
                                            <DetailRow label="Email:">
                                                <span className="break-all">{editing.email || '-'}</span>
                                            </DetailRow>
                                        </dl>
                                    </section>

                                    {/* Informasi Pembayaran dan Pengiriman */}
                                    <section className="rounded-2xl bg-background-secondary-default p-4 text-body-regular">
                                        <h3 className="mb-3 text-center text-body-medium font-semibold text-text-primary">
                                            Informasi Pembayaran dan Pengiriman
                                        </h3>
                                        <dl className="space-y-0.5">
                                            <DetailRow label="Metode Pembayaran:">{editing.paymentMethod?.name || '-'}</DetailRow>
                                            <DetailRow label="Nama Pemilik Rekening:">
                                                {editing.bankAccountName || 'xxxx xxxx'}
                                            </DetailRow>
                                            <DetailRow label="Nomor Rekening:">
                                                <span className="tabular-nums">
                                                    {editing.bankAccountNumber || 'xxxx-xxxx-xxxx-xxxx'}
                                                </span>
                                            </DetailRow>
                                            <DetailRow label="Metode Pengiriman:">{shippingLabel || '-'}</DetailRow>
                                            {!isPickup && editing.trackingNumber && (
                                                <DetailRow label="No. Resi:">
                                                    <span className="break-all tabular-nums" dir="ltr">
                                                        {editing.trackingNumber}
                                                    </span>
                                                </DetailRow>
                                            )}
                                        </dl>

                                        <dl className="mt-4 space-y-0.5">
                                            <DetailRow label="Subtotal Pembayaran:">
                                                <span className="tabular-nums">{formatRupiah(subtotal)}</span>
                                            </DetailRow>
                                            <DetailRow label="Voucher Diskon:">
                                                {editing.voucherDiscount && editing.voucherDiscount > 0 ? (
                                                    <span className="tabular-nums text-text-error-primary">
                                                        -{formatRupiah(editing.voucherDiscount)}
                                                        {editing.voucher?.name ? ` (${editing.voucher.name})` : ''}
                                                    </span>
                                                ) : (
                                                    '0'
                                                )}
                                            </DetailRow>
                                            <DetailRow label="Biaya Pengiriman:">
                                                <span className="tabular-nums">
                                                    {editing.ongkir ? formatRupiah(editing.ongkir) : '0'}
                                                </span>
                                            </DetailRow>
                                            <DetailRow label="Fee Admin Pembayaran:">
                                                <span className="tabular-nums">
                                                    {editing.adminFee ? formatRupiah(editing.adminFee) : '0'}
                                                </span>
                                            </DetailRow>
                                        </dl>

                                        <dl className="mt-4 border-t border-separator-border pt-3">
                                            <DetailRow label="Total:" strong>
                                                <span className="tabular-nums">{formatRupiah(editing.total)}</span>
                                            </DetailRow>
                                        </dl>
                                    </section>
                                </div>

                                {/* Ubah status */}
                                <section className="space-y-3 rounded-2xl border border-border-button-default p-4">
                                    <p className="text-body-medium font-semibold text-text-primary">Ubah Status Pesanan</p>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
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

                                    {!isPickup && (
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
                                </section>

                                <div className="flex flex-wrap justify-end gap-2 pb-1">
                                    <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                                        Tutup
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
                        )
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    )
}
