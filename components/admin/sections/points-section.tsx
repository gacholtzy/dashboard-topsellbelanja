"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiGiftLine, RiRefreshLine } from '@remixicon/react'
import { Button } from '@/components/base/buttons/button'
import { Chip } from '@/components/base/badges/chip'
import { Input } from '@/components/base/input/input'
import { SearchField } from '@/components/base/search-field/search-field'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
    adminFetch,
    formatRupiah,
    type AdminPointCatalogItem,
    type AdminUser,
} from '@/lib/admin-api'

const EMPTY_CATALOG = {
    name: '',
    pointCost: '10000',
    discountValue: '10000',
    minTransaction: '100000',
    validityDays: '30',
    isActive: true,
}

export function PointsSection({
    mode,
    onUnauthorized,
}: {
    mode: 'catalog' | 'adjust'
    onUnauthorized: () => void
}) {
    const { toast } = useToast()
    const [catalog, setCatalog] = useState<AdminPointCatalogItem[]>([])
    const [users, setUsers] = useState<AdminUser[]>([])
    const [userSearch, setUserSearch] = useState('')
    const [loading, setLoading] = useState(true)

    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(EMPTY_CATALOG)
    const [saving, setSaving] = useState(false)

    const [adjustUser, setAdjustUser] = useState<AdminUser | null>(null)
    const [adjustAmount, setAdjustAmount] = useState('5000')
    const [adjustDesc, setAdjustDesc] = useState('Bonus poin dari admin')

    const load = useCallback(async () => {
        setLoading(true)
        try {
            if (mode === 'catalog') {
                setCatalog(await adminFetch<AdminPointCatalogItem[]>('/admin/points/catalog'))
            } else {
                const q = userSearch.trim() ? `?search=${encodeURIComponent(userSearch.trim())}` : ''
                setUsers(await adminFetch<AdminUser[]>(`/admin/users${q}`))
            }
        } catch (err: unknown) {
            if ((err as { status?: number })?.status === 401) {
                onUnauthorized()
                return
            }
            toast({ title: 'Gagal memuat data poin', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [mode, userSearch, onUnauthorized, toast])

    useEffect(() => {
        load()
    }, [load])

    const handleSaveCatalog = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                name: form.name,
                pointCost: Number(form.pointCost) || 1000,
                discountValue: Number(form.discountValue) || 1000,
                minTransaction: Number(form.minTransaction) || 0,
                validityDays: Number(form.validityDays) || 30,
                isActive: form.isActive,
            }
            if (editingId) {
                await adminFetch(`/admin/points/catalog/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                })
                toast({ title: 'Katalog poin diperbarui' })
            } else {
                await adminFetch('/admin/points/catalog', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                })
                toast({ title: 'Reward poin ditambahkan' })
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

    const handleAdjustSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!adjustUser) return
        setSaving(true)
        try {
            await adminFetch('/admin/points/adjust', {
                method: 'POST',
                body: JSON.stringify({
                    userId: adjustUser.id,
                    amount: Number(adjustAmount) || 0,
                    description: adjustDesc.trim() || 'Penyesuaian admin',
                }),
            })
            toast({ title: `Poin ${adjustUser.fullName} diperbarui` })
            setAdjustUser(null)
            load()
        } catch (err) {
            toast({
                title: 'Gagal mengubah poin',
                description: err instanceof Error ? err.message : 'Terjadi kesalahan',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    if (mode === 'adjust') {
        return (
            <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SearchField
                        aria-label="Cari user"
                        placeholder="Cari nama atau nomor WhatsApp..."
                        value={userSearch}
                        onChange={setUserSearch}
                        shape="rounded"
                        className="sm:max-w-sm"
                    />
                    <Button variant="secondary" size="medium" leadingIcon={RiRefreshLine} onClick={load}>
                        Segarkan
                    </Button>
                </div>

                <section className="overflow-hidden rounded-3xl border border-border-button-default bg-background-full">
                    {loading ? (
                        <div className="space-y-3 p-6">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} shape="rect" className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-start text-body-regular">
                                <thead>
                                    <tr className="border-b border-separator-border text-caption-1-semibold text-text-tertiary">
                                        <th className="px-5 py-3.5 text-start">User</th>
                                        <th className="px-4 py-3.5 text-start">No. WhatsApp</th>
                                        <th className="px-4 py-3.5 text-end">Saldo Poin</th>
                                        <th className="px-5 py-3.5 text-end">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-separator-border">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-background-secondary-hover/60">
                                            <td className="px-5 py-3.5 font-medium text-text-primary">{u.fullName}</td>
                                            <td className="px-4 py-3.5 tabular-nums text-text-secondary" dir="ltr">
                                                {u.phoneNumber}
                                            </td>
                                            <td className="px-4 py-3.5 text-end font-semibold tabular-nums text-text-primary">
                                                {u.points.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-5 py-3.5 text-end">
                                                <Button
                                                    variant="secondary"
                                                    size="small"
                                                    leadingIcon={RiGiftLine}
                                                    onClick={() => {
                                                        setAdjustUser(u)
                                                        setAdjustAmount('5000')
                                                    }}
                                                >
                                                    Ubah Poin
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <Dialog open={adjustUser !== null} onOpenChange={(o) => !o && setAdjustUser(null)}>
                    <DialogContent aria-label="Penyesuaian poin">
                        {adjustUser && (
                            <form onSubmit={handleAdjustSubmit} className="space-y-4">
                                <DialogHeader>
                                    <DialogTitle>Kelola Poin · {adjustUser.fullName}</DialogTitle>
                                    <DialogDescription>
                                        Saldo saat ini: {adjustUser.points.toLocaleString('id-ID')} poin. Gunakan angka negatif untuk mengurangi.
                                    </DialogDescription>
                                </DialogHeader>
                                <Input
                                    label="Jumlah Poin (+/-)"
                                    type="number"
                                    value={adjustAmount}
                                    onChange={setAdjustAmount}
                                />
                                <Input
                                    label="Keterangan"
                                    value={adjustDesc}
                                    onChange={setAdjustDesc}
                                />
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="secondary" onClick={() => setAdjustUser(null)}>
                                        Batal
                                    </Button>
                                    <Button type="submit" variant="primary" disabled={saving}>
                                        {saving ? 'Menyimpan...' : 'Simpan'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-body-regular text-text-secondary">
                    Katalog di sini langsung tampil di halaman /points untuk ditukar menjadi voucher oleh pelanggan.
                </p>
                <Button
                    variant="primary"
                    size="medium"
                    leadingIcon={RiAddLine}
                    onClick={() => {
                        setEditingId(null)
                        setForm(EMPTY_CATALOG)
                        setModalOpen(true)
                    }}
                >
                    Tambah Reward
                </Button>
            </div>

            <section className="overflow-hidden rounded-3xl border border-border-button-default bg-background-full">
                {loading ? (
                    <div className="space-y-3 p-6">
                        {[1, 2].map((i) => (
                            <Skeleton key={i} shape="rect" className="h-14 w-full" />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-body-regular">
                            <thead>
                                <tr className="border-b border-separator-border text-caption-1-semibold text-text-tertiary">
                                    <th className="px-5 py-3.5 text-start">Nama Reward</th>
                                    <th className="px-4 py-3.5 text-end">Biaya Poin</th>
                                    <th className="px-4 py-3.5 text-end">Nilai Voucher</th>
                                    <th className="px-4 py-3.5 text-end">Min. Belanja</th>
                                    <th className="px-4 py-3.5 text-center">Status</th>
                                    <th className="px-5 py-3.5 text-end">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-separator-border">
                                {catalog.map((c) => (
                                    <tr key={c.id} className="hover:bg-background-secondary-hover/60">
                                        <td className="px-5 py-3.5 font-medium text-text-primary">{c.name}</td>
                                        <td className="px-4 py-3.5 text-end tabular-nums text-text-primary">
                                            {c.pointCost.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3.5 text-end tabular-nums text-text-primary">
                                            {formatRupiah(c.discountValue)}
                                        </td>
                                        <td className="px-4 py-3.5 text-end tabular-nums text-text-secondary">
                                            {formatRupiah(c.minTransaction)}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <Chip variant="caption" color={c.isActive ? 'lime' : 'neutral'}>
                                                {c.isActive ? 'Aktif' : 'Nonaktif'}
                                            </Chip>
                                        </td>
                                        <td className="px-5 py-3.5 text-end">
                                            <div className="inline-flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="small"
                                                    iconOnly
                                                    leadingIcon={RiEditLine}
                                                    aria-label={`Edit ${c.name}`}
                                                    onClick={() => {
                                                        setEditingId(c.id)
                                                        setForm({
                                                            name: c.name,
                                                            pointCost: String(c.pointCost),
                                                            discountValue: String(c.discountValue),
                                                            minTransaction: String(c.minTransaction),
                                                            validityDays: String(c.validityDays),
                                                            isActive: c.isActive,
                                                        })
                                                        setModalOpen(true)
                                                    }}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="small"
                                                    iconOnly
                                                    leadingIcon={RiDeleteBinLine}
                                                    aria-label={`Hapus ${c.name}`}
                                                    onClick={async () => {
                                                        await adminFetch(`/admin/points/catalog/${c.id}`, { method: 'DELETE' })
                                                        toast({ title: 'Reward dihapus' })
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
                <DialogContent aria-label="Form katalog poin">
                    <form onSubmit={handleSaveCatalog} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Reward Poin' : 'Tambah Reward Poin'}</DialogTitle>
                        </DialogHeader>
                        <Input
                            label="Nama Reward"
                            placeholder="Voucher Rp50.000"
                            value={form.name}
                            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                            isRequired
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Input
                                label="Biaya Poin"
                                type="number"
                                value={form.pointCost}
                                onChange={(v) => setForm((f) => ({ ...f, pointCost: v }))}
                            />
                            <Input
                                label="Nilai Potongan (Rp)"
                                type="number"
                                value={form.discountValue}
                                onChange={(v) => setForm((f) => ({ ...f, discountValue: v }))}
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Input
                                label="Min. Belanja (Rp)"
                                type="number"
                                value={form.minTransaction}
                                onChange={(v) => setForm((f) => ({ ...f, minTransaction: v }))}
                            />
                            <Input
                                label="Masa Berlaku (Hari)"
                                type="number"
                                value={form.validityDays}
                                onChange={(v) => setForm((f) => ({ ...f, validityDays: v }))}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
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
