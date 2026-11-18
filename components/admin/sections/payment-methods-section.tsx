"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiRefreshLine } from '@remixicon/react'
import { Button } from '@/components/base/buttons/button'
import { Chip } from '@/components/base/badges/chip'
import { Input } from '@/components/base/input/input'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PaymentMark } from '@/components/payment-mark'
import { useToast } from '@/hooks/use-toast'
import { adminFetch, formatRupiah, type AdminPaymentMethod } from '@/lib/admin-api'

const EMPTY_PM = {
    groupKey: 'va',
    groupName: 'Virtual Account',
    key: 'mandiri',
    name: 'Mandiri Virtual Account',
    adminFee: '4000',
    adminFeeType: 'fixed' as 'fixed' | 'percentage',
    sortOrder: '10',
    isActive: true,
}

export function PaymentMethodsSection({ onUnauthorized }: { onUnauthorized: () => void }) {
    const { toast } = useToast()
    const [methods, setMethods] = useState<AdminPaymentMethod[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(EMPTY_PM)
    const [saving, setSaving] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            setMethods(await adminFetch<AdminPaymentMethod[]>('/admin/payment-methods'))
        } catch (err: unknown) {
            if ((err as { status?: number })?.status === 401) {
                onUnauthorized()
                return
            }
            toast({ title: 'Gagal memuat metode pembayaran', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [onUnauthorized, toast])

    useEffect(() => {
        load()
    }, [load])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                groupKey: form.groupKey,
                groupName: form.groupName,
                key: form.key,
                name: form.name,
                adminFee: Number(form.adminFee) || 0,
                adminFeeType: form.adminFeeType,
                sortOrder: Number(form.sortOrder) || 10,
                isActive: form.isActive,
            }
            if (editingId) {
                await adminFetch(`/admin/payment-methods/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                })
                toast({ title: 'Metode pembayaran diperbarui' })
            } else {
                await adminFetch('/admin/payment-methods', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                })
                toast({ title: 'Metode pembayaran ditambahkan & aktif di checkout' })
            }
            setModalOpen(false)
            load()
        } catch (err) {
            toast({
                title: 'Gagal menyimpan',
                description: err instanceof Error ? err.message : 'Terjadi kesalahan',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-body-regular text-text-secondary">
                    Metode pembayaran aktif di sini langsung muncul di Langkah 3 halaman checkout beserta biaya adminnya.
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="medium" leadingIcon={RiRefreshLine} onClick={load}>
                        Segarkan
                    </Button>
                    <Button
                        variant="primary"
                        size="medium"
                        leadingIcon={RiAddLine}
                        onClick={() => {
                            setEditingId(null)
                            setForm(EMPTY_PM)
                            setModalOpen(true)
                        }}
                    >
                        Tambah Metode
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
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-body-regular">
                            <thead>
                                <tr className="border-b border-separator-border text-caption-1-semibold text-text-tertiary">
                                    <th className="px-5 py-3.5 text-start">Metode</th>
                                    <th className="px-4 py-3.5 text-start">Grup</th>
                                    <th className="px-4 py-3.5 text-end">Biaya Admin</th>
                                    <th className="px-4 py-3.5 text-center">Status</th>
                                    <th className="px-5 py-3.5 text-end">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-separator-border">
                                {methods.map((m) => (
                                    <tr key={m.id} className="hover:bg-background-secondary-hover/60">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <PaymentMark method={{ key: m.key, name: m.name }} className="h-7 w-11 p-1" />
                                                <div>
                                                    <p className="font-medium text-text-primary">{m.name}</p>
                                                    <p className="text-caption-1-regular text-text-tertiary">key: {m.key}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-text-secondary">{m.groupName}</td>
                                        <td className="px-4 py-3.5 text-end font-medium tabular-nums text-text-primary">
                                            {m.adminFee === 0
                                                ? 'Gratis'
                                                : m.adminFeeType === 'percentage'
                                                  ? `${m.adminFee}%`
                                                  : formatRupiah(m.adminFee)}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    await adminFetch(`/admin/payment-methods/${m.id}`, {
                                                        method: 'PUT',
                                                        body: JSON.stringify({ isActive: !m.isActive }),
                                                    })
                                                    load()
                                                }}
                                            >
                                                <Chip variant="caption" color={m.isActive ? 'lime' : 'neutral'}>
                                                    {m.isActive ? 'Aktif' : 'Nonaktif'}
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
                                                    aria-label={`Edit ${m.name}`}
                                                    onClick={() => {
                                                        setEditingId(m.id)
                                                        setForm({
                                                            groupKey: m.groupKey,
                                                            groupName: m.groupName,
                                                            key: m.key,
                                                            name: m.name,
                                                            adminFee: String(m.adminFee),
                                                            adminFeeType: m.adminFeeType,
                                                            sortOrder: String(m.sortOrder),
                                                            isActive: m.isActive,
                                                        })
                                                        setModalOpen(true)
                                                    }}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="small"
                                                    iconOnly
                                                    leadingIcon={RiDeleteBinLine}
                                                    aria-label={`Hapus ${m.name}`}
                                                    onClick={async () => {
                                                        await adminFetch(`/admin/payment-methods/${m.id}`, { method: 'DELETE' })
                                                        toast({ title: 'Metode pembayaran dihapus' })
                                                        load()
                                                    }}
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

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent aria-label="Form metode pembayaran">
                    <form onSubmit={handleSave} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}</DialogTitle>
                            <DialogDescription>Key logo yang tersedia: manual, bca, bni, mandiri, bri, permata, qris, cc.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Input label="Nama Grup" placeholder="Virtual Account" value={form.groupName} onChange={(v) => setForm((f) => ({ ...f, groupName: v }))} isRequired />
                            <Input label="Key Grup" placeholder="va" value={form.groupKey} onChange={(v) => setForm((f) => ({ ...f, groupKey: v }))} isRequired />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Input label="Nama Metode" placeholder="Mandiri Virtual Account" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} isRequired />
                            <Input label="Key Logo" placeholder="mandiri" value={form.key} onChange={(v) => setForm((f) => ({ ...f, key: v.toLowerCase() }))} isRequired />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Input label="Biaya Admin" type="number" value={form.adminFee} onChange={(v) => setForm((f) => ({ ...f, adminFee: v }))} />
                            <div>
                                <label className="mb-1 block text-body-medium text-text-primary">Tipe Biaya</label>
                                <select
                                    value={form.adminFeeType}
                                    onChange={(e) => setForm((f) => ({ ...f, adminFeeType: e.target.value as 'fixed' | 'percentage' }))}
                                    className="h-9 w-full rounded-2lg border border-border-button-default bg-background-secondary-default px-3 text-body-regular text-text-primary"
                                >
                                    <option value="fixed">Nominal (Rp)</option>
                                    <option value="percentage">Persentase (%)</option>
                                </select>
                            </div>
                            <Input label="Urutan" type="number" value={form.sortOrder} onChange={(v) => setForm((f) => ({ ...f, sortOrder: v }))} />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
                            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
