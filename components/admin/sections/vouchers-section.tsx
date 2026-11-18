"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiRefreshLine } from '@remixicon/react'
import { Button } from '@/components/base/buttons/button'
import { Chip } from '@/components/base/badges/chip'
import { Input } from '@/components/base/input/input'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { adminFetch, formatRupiah, type AdminVoucher } from '@/lib/admin-api'

const EMPTY_FORM = {
    name: '',
    type: 'fixed' as 'fixed' | 'percent' | 'shipping',
    description: '',
    minTransaction: '0',
    discount: '10000',
    maxDiscount: '0',
    fulfillmentType: 'all' as 'all' | 'delivery' | 'pickup',
    qty: '100',
    isAutoApply: false,
    isActive: true,
}

export function VouchersSection({
    startInCreateMode = false,
    onDoneCreateMode,
    onUnauthorized,
}: {
    startInCreateMode?: boolean
    onDoneCreateMode?: () => void
    onUnauthorized: () => void
}) {
    const { toast } = useToast()
    const [vouchers, setVouchers] = useState<AdminVoucher[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(startInCreateMode)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (startInCreateMode) {
            setEditingId(null)
            setForm(EMPTY_FORM)
            setModalOpen(true)
        }
    }, [startInCreateMode])

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const rows = await adminFetch<AdminVoucher[]>('/admin/vouchers')
            setVouchers(rows)
        } catch (err: unknown) {
            if ((err as { status?: number })?.status === 401) {
                onUnauthorized()
                return
            }
            toast({ title: 'Gagal memuat voucher', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [onUnauthorized, toast])

    useEffect(() => {
        load()
    }, [load])

    const openCreate = () => {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setModalOpen(true)
    }

    const openEdit = (v: AdminVoucher) => {
        setEditingId(v.id)
        setForm({
            name: v.name,
            type: v.type,
            description: v.description,
            minTransaction: String(v.minTransaction),
            discount: String(v.discount),
            maxDiscount: String(v.maxDiscount),
            fulfillmentType: v.fulfillmentType,
            qty: String(v.qty),
            isAutoApply: v.isAutoApply,
            isActive: v.isActive,
        })
        setModalOpen(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                name: form.name,
                type: form.type,
                description: form.description,
                minTransaction: Number(form.minTransaction) || 0,
                discount: Number(form.discount) || 0,
                maxDiscount: Number(form.maxDiscount) || 0,
                fulfillmentType: form.fulfillmentType,
                qty: Number(form.qty) || 100,
                isAutoApply: form.isAutoApply,
                isActive: form.isActive,
            }
            if (editingId) {
                await adminFetch(`/admin/vouchers/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                })
                toast({ title: 'Voucher diperbarui' })
            } else {
                await adminFetch('/admin/vouchers', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                })
                toast({ title: 'Voucher dibuat dan langsung aktif di checkout' })
            }
            setModalOpen(false)
            onDoneCreateMode?.()
            load()
        } catch (err) {
            toast({
                title: 'Gagal menyimpan voucher',
                description: err instanceof Error ? err.message : 'Terjadi kesalahan',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    const toggleActive = async (v: AdminVoucher) => {
        try {
            await adminFetch(`/admin/vouchers/${v.id}`, {
                method: 'PUT',
                body: JSON.stringify({ isActive: !v.isActive }),
            })
            load()
        } catch {
            toast({ title: 'Gagal mengubah status voucher', variant: 'destructive' })
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await adminFetch(`/admin/vouchers/${id}`, { method: 'DELETE' })
            toast({ title: 'Voucher dihapus' })
            load()
        } catch {
            toast({ title: 'Gagal menghapus voucher', variant: 'destructive' })
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-body-regular text-text-secondary">
                    Voucher aktif di sini langsung muncul di pilihan voucher halaman checkout.
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="medium" leadingIcon={RiRefreshLine} onClick={load}>
                        Segarkan
                    </Button>
                    <Button variant="primary" size="medium" leadingIcon={RiAddLine} onClick={openCreate}>
                        Buat Voucher
                    </Button>
                </div>
            </div>

            <section className="overflow-hidden rounded-3xl border border-border-button-default bg-background-full">
                {loading ? (
                    <div className="space-y-3 p-6">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} shape="rect" className="h-14 w-full" />
                        ))}
                    </div>
                ) : vouchers.length === 0 ? (
                    <p className="p-8 text-center text-body-regular text-text-secondary">Belum ada voucher.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-body-regular">
                            <thead>
                                <tr className="border-b border-separator-border text-caption-1-semibold text-text-tertiary">
                                    <th className="px-5 py-3.5 text-start">Kode & Deskripsi</th>
                                    <th className="px-4 py-3.5 text-start">Tipe & Diskon</th>
                                    <th className="px-4 py-3.5 text-start">Syarat</th>
                                    <th className="px-4 py-3.5 text-center">Kuota</th>
                                    <th className="px-4 py-3.5 text-center">Status</th>
                                    <th className="px-5 py-3.5 text-end">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-separator-border">
                                {vouchers.map((v) => (
                                    <tr key={v.id} className="hover:bg-background-secondary-hover/60">
                                        <td className="px-5 py-3.5">
                                            <p className="font-semibold text-text-primary">{v.name}</p>
                                            <p className="text-caption-1-regular text-text-secondary">{v.description}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="font-medium tabular-nums text-text-primary">
                                                {v.type === 'percent' ? `${v.discount}%` : formatRupiah(v.discount)}
                                            </p>
                                            <p className="text-caption-1-regular text-text-tertiary">
                                                {v.type === 'shipping' ? 'Ongkir' : v.type === 'percent' ? 'Persen' : 'Nominal'}
                                                {v.isAutoApply ? ' · Auto' : ''}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3.5 text-caption-1-regular text-text-secondary">
                                            <p>Min. {formatRupiah(v.minTransaction)}</p>
                                            <p>Metode: {v.fulfillmentType}</p>
                                        </td>
                                        <td className="px-4 py-3.5 text-center tabular-nums text-text-primary">
                                            {v.usedQty} / {v.qty}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <button type="button" onClick={() => toggleActive(v)}>
                                                <Chip variant="caption" color={v.isActive ? 'lime' : 'neutral'}>
                                                    {v.isActive ? 'Aktif' : 'Nonaktif'}
                                                </Chip>
                                            </button>
                                        </td>
                                        <td className="px-5 py-3.5 text-end">
                                            <div className="inline-flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="small"
                                                    iconOnly
                                                    leadingIcon={RiEditLine}
                                                    aria-label={`Edit ${v.name}`}
                                                    onClick={() => openEdit(v)}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="small"
                                                    iconOnly
                                                    leadingIcon={RiDeleteBinLine}
                                                    aria-label={`Hapus ${v.name}`}
                                                    onClick={() => handleDelete(v.id)}
                                                    className="text-text-error-primary"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <Dialog
                open={modalOpen}
                onOpenChange={(o) => {
                    setModalOpen(o)
                    if (!o) onDoneCreateMode?.()
                }}
            >
                <DialogContent aria-label="Form voucher">
                    <form onSubmit={handleSave} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Voucher' : 'Buat Voucher Baru'}</DialogTitle>
                            <DialogDescription>Perubahan langsung berlaku di halaman checkout.</DialogDescription>
                        </DialogHeader>

                        <Input
                            label="Kode Voucher"
                            placeholder="mis. PROMO50"
                            value={form.name}
                            onChange={(v) => setForm((f) => ({ ...f, name: v.toUpperCase() }))}
                            isRequired
                        />
                        <Input
                            label="Deskripsi"
                            placeholder="Potongan Rp50.000 min. belanja Rp500.000"
                            value={form.description}
                            onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                        />

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-body-medium text-text-primary">Tipe Diskon</label>
                                <select
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, type: e.target.value as 'fixed' | 'percent' | 'shipping' }))
                                    }
                                    className="h-9 w-full rounded-2lg border border-border-button-default bg-background-secondary-default px-3 text-body-regular text-text-primary"
                                >
                                    <option value="fixed">Potongan Nominal (Rp)</option>
                                    <option value="percent">Persentase (%)</option>
                                    <option value="shipping">Gratis Ongkir (Rp)</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-body-medium text-text-primary">Berlaku Untuk</label>
                                <select
                                    value={form.fulfillmentType}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, fulfillmentType: e.target.value as 'all' | 'delivery' | 'pickup' }))
                                    }
                                    className="h-9 w-full rounded-2lg border border-border-button-default bg-background-secondary-default px-3 text-body-regular text-text-primary"
                                >
                                    <option value="all">Semua Pengiriman</option>
                                    <option value="delivery">Diantar / Kurir</option>
                                    <option value="pickup">Ambil di Toko</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Input
                                label={form.type === 'percent' ? 'Diskon (%)' : 'Nilai Diskon (Rp)'}
                                type="number"
                                value={form.discount}
                                onChange={(v) => setForm((f) => ({ ...f, discount: v }))}
                            />
                            <Input
                                label="Maks. Diskon (Rp, 0 = tanpa batas)"
                                type="number"
                                value={form.maxDiscount}
                                onChange={(v) => setForm((f) => ({ ...f, maxDiscount: v }))}
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Input
                                label="Min. Transaksi (Rp)"
                                type="number"
                                value={form.minTransaction}
                                onChange={(v) => setForm((f) => ({ ...f, minTransaction: v }))}
                            />
                            <Input
                                label="Kuota Pemakaian"
                                type="number"
                                value={form.qty}
                                onChange={(v) => setForm((f) => ({ ...f, qty: v }))}
                            />
                        </div>

                        <label className="flex items-center gap-2 text-body-regular text-text-primary">
                            <input
                                type="checkbox"
                                checked={form.isAutoApply}
                                onChange={(e) => setForm((f) => ({ ...f, isAutoApply: e.target.checked }))}
                            />
                            Terapkan otomatis di checkout jika memenuhi syarat
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setModalOpen(false)
                                    onDoneCreateMode?.()
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" variant="primary" disabled={saving}>
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
