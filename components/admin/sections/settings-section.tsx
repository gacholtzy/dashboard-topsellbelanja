"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiRefreshLine, RiSaveLine } from '@remixicon/react'
import { Button } from '@/components/base/buttons/button'
import { Chip } from '@/components/base/badges/chip'
import { Input } from '@/components/base/input/input'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { Textarea } from '@/components/base/textarea/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
    adminFetch,
    type AdminSettings,
    type AdminStore,
    type AdminWebhook,
    type StoreAreaItem,
} from '@/lib/admin-api'

export function SettingsSection({
    mode,
    onUnauthorized,
}: {
    mode: 'webhooks' | 'app-settings' | 'stores' | 'store-areas'
    onUnauthorized: () => void
}) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Webhooks
    const [webhooks, setWebhooks] = useState<AdminWebhook[]>([])
    const [whOpen, setWhOpen] = useState(false)
    const [whForm, setWhForm] = useState({ name: '', url: '', secret: '', events: 'order.created,order.status_updated' })

    // App Settings & Store Areas
    const [appForm, setAppForm] = useState({
        store_name: 'Topsell Belanja',
        support_whatsapp: '',
        point_to_rupiah: '1',
        new_member_points: '20000',
        meta_your_pixel: '',
        body_script: '',
    })
    const [areas, setAreas] = useState<StoreAreaItem[]>([])
    const [areaOpen, setAreaOpen] = useState(false)
    const [areaForm, setAreaForm] = useState({ name: '', city: '', province: 'Jawa Timur' })

    // Store Locations
    const [stores, setStores] = useState<AdminStore[]>([])
    const [storeOpen, setStoreOpen] = useState(false)
    const [editingStoreId, setEditingStoreId] = useState<string | null>(null)
    const [storeForm, setStoreForm] = useState({ name: '', address: '', areaName: 'Sidoarjo', isActive: true })

    const load = useCallback(async () => {
        setLoading(true)
        try {
            if (mode === 'webhooks') {
                setWebhooks(await adminFetch<AdminWebhook[]>('/admin/webhooks'))
            } else if (mode === 'stores') {
                setStores(await adminFetch<AdminStore[]>('/admin/stores'))
            } else {
                const s = await adminFetch<AdminSettings>('/admin/settings')
                if (s.app_settings) {
                    setAppForm({
                        store_name: s.app_settings.store_name || 'Topsell Belanja',
                        support_whatsapp: s.app_settings.support_whatsapp || '',
                        point_to_rupiah: String(s.app_settings.point_to_rupiah ?? 1),
                        new_member_points: String(s.app_settings.new_member_points ?? 20000),
                        meta_your_pixel: s.app_settings.meta_your_pixel || '',
                        body_script: s.app_settings.body_script || '',
                    })
                }
                setAreas(s.store_areas || [])
            }
        } catch (err: unknown) {
            if ((err as { status?: number })?.status === 401) {
                onUnauthorized()
                return
            }
            toast({ title: 'Gagal memuat pengaturan', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [mode, onUnauthorized, toast])

    useEffect(() => {
        load()
    }, [load])

    if (loading) {
        return (
            <div className="space-y-3 rounded-3xl border border-border-button-default bg-background-full p-6">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} shape="rect" className="h-12 w-full" />
                ))}
            </div>
        )
    }

    if (mode === 'webhooks') {
        return (
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-body-regular text-text-secondary">
                        Kirim notifikasi HTTP POST otomatis saat pesanan dibuat atau statusnya berubah.
                    </p>
                    <Button variant="primary" size="medium" leadingIcon={RiAddLine} onClick={() => setWhOpen(true)}>
                        Tambah Webhook
                    </Button>
                </div>

                <section className="overflow-hidden rounded-3xl border border-border-button-default bg-background-full">
                    {webhooks.length === 0 ? (
                        <p className="p-8 text-center text-body-regular text-text-secondary">Belum ada webhook.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-start text-body-regular">
                                <thead>
                                    <tr className="border-b border-separator-border text-caption-1-semibold text-text-tertiary">
                                        <th className="px-5 py-3.5 text-start">Nama & URL</th>
                                        <th className="px-4 py-3.5 text-start">Events</th>
                                        <th className="px-4 py-3.5 text-center">Status</th>
                                        <th className="px-5 py-3.5 text-end">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-separator-border">
                                    {webhooks.map((w) => (
                                        <tr key={w.id} className="hover:bg-background-secondary-hover/60">
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-text-primary">{w.name}</p>
                                                <p className="break-all text-caption-1-regular text-text-secondary" dir="ltr">
                                                    {w.url}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5 text-caption-1-regular text-text-secondary">
                                                {w.events.join(', ')}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        await adminFetch(`/admin/webhooks/${w.id}`, {
                                                            method: 'PUT',
                                                            body: JSON.stringify({ isActive: !w.isActive }),
                                                        })
                                                        load()
                                                    }}
                                                >
                                                    <Chip variant="caption" color={w.isActive ? 'lime' : 'neutral'}>
                                                        {w.isActive ? 'Aktif' : 'Nonaktif'}
                                                    </Chip>
                                                </button>
                                            </td>
                                            <td className="px-5 py-3.5 text-end">
                                                <Button
                                                    variant="ghost"
                                                    size="small"
                                                    iconOnly
                                                    leadingIcon={RiDeleteBinLine}
                                                    aria-label={`Hapus ${w.name}`}
                                                    onClick={async () => {
                                                        await adminFetch(`/admin/webhooks/${w.id}`, { method: 'DELETE' })
                                                        toast({ title: 'Webhook dihapus' })
                                                        load()
                                                    }}
                                                    className="text-text-error-primary"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <Dialog open={whOpen} onOpenChange={setWhOpen}>
                    <DialogContent aria-label="Tambah webhook">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault()
                                setSaving(true)
                                try {
                                    await adminFetch('/admin/webhooks', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            name: whForm.name,
                                            url: whForm.url,
                                            secret: whForm.secret,
                                            events: whForm.events.split(',').map((s) => s.trim()).filter(Boolean),
                                        }),
                                    })
                                    toast({ title: 'Webhook ditambahkan' })
                                    setWhOpen(false)
                                    setWhForm({ name: '', url: '', secret: '', events: 'order.created,order.status_updated' })
                                    load()
                                } catch (err) {
                                    toast({
                                        title: 'Gagal menambah webhook',
                                        description: err instanceof Error ? err.message : 'Terjadi kesalahan',
                                        variant: 'destructive',
                                    })
                                } finally {
                                    setSaving(false)
                                }
                            }}
                            className="space-y-4"
                        >
                            <DialogHeader>
                                <DialogTitle>Tambah Webhook</DialogTitle>
                                <DialogDescription>Event didukung: order.created, order.status_updated</DialogDescription>
                            </DialogHeader>
                            <Input label="Nama" placeholder="Notifikasi POS" value={whForm.name} onChange={(v) => setWhForm((f) => ({ ...f, name: v }))} isRequired />
                            <Input label="Endpoint URL" placeholder="https://example.com/webhook" value={whForm.url} onChange={(v) => setWhForm((f) => ({ ...f, url: v }))} isRequired />
                            <Input label="Secret (opsional)" value={whForm.secret} onChange={(v) => setWhForm((f) => ({ ...f, secret: v }))} />
                            <Input label="Events (pisah koma)" value={whForm.events} onChange={(v) => setWhForm((f) => ({ ...f, events: v }))} />
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="secondary" onClick={() => setWhOpen(false)}>Batal</Button>
                                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    if (mode === 'stores') {
        return (
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-body-regular text-text-secondary">
                        Cabang aktif di sini langsung muncul di pilihan &ldquo;Ambil di Toko&rdquo; pada halaman checkout.
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="medium" leadingIcon={RiRefreshLine} onClick={load}>Segarkan</Button>
                        <Button
                            variant="primary"
                            size="medium"
                            leadingIcon={RiAddLine}
                            onClick={() => {
                                setEditingStoreId(null)
                                setStoreForm({ name: '', address: '', areaName: 'Sidoarjo', isActive: true })
                                setStoreOpen(true)
                            }}
                        >
                            Tambah Cabang
                        </Button>
                    </div>
                </div>

                <section className="overflow-hidden rounded-3xl border border-border-button-default bg-background-full">
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-body-regular">
                            <thead>
                                <tr className="border-b border-separator-border text-caption-1-semibold text-text-tertiary">
                                    <th className="px-5 py-3.5 text-start">Nama Cabang</th>
                                    <th className="px-4 py-3.5 text-start">Area</th>
                                    <th className="px-4 py-3.5 text-start">Alamat</th>
                                    <th className="px-4 py-3.5 text-center">Status</th>
                                    <th className="px-5 py-3.5 text-end">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-separator-border">
                                {stores.map((s) => (
                                    <tr key={s.id} className="hover:bg-background-secondary-hover/60">
                                        <td className="px-5 py-3.5 font-medium text-text-primary">{s.name}</td>
                                        <td className="px-4 py-3.5 text-text-secondary">{s.areaName}</td>
                                        <td className="px-4 py-3.5 text-text-secondary">{s.address}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    await adminFetch(`/admin/stores/${s.id}`, {
                                                        method: 'PUT',
                                                        body: JSON.stringify({ isActive: !s.isActive }),
                                                    })
                                                    load()
                                                }}
                                            >
                                                <Chip variant="caption" color={s.isActive ? 'lime' : 'neutral'}>
                                                    {s.isActive ? 'Aktif' : 'Nonaktif'}
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
                                                    aria-label={`Edit ${s.name}`}
                                                    onClick={() => {
                                                        setEditingStoreId(s.id)
                                                        setStoreForm({ name: s.name, address: s.address, areaName: s.areaName, isActive: s.isActive })
                                                        setStoreOpen(true)
                                                    }}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="small"
                                                    iconOnly
                                                    leadingIcon={RiDeleteBinLine}
                                                    aria-label={`Hapus ${s.name}`}
                                                    onClick={async () => {
                                                        await adminFetch(`/admin/stores/${s.id}`, { method: 'DELETE' })
                                                        toast({ title: 'Cabang dihapus' })
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
                </section>

                <Dialog open={storeOpen} onOpenChange={setStoreOpen}>
                    <DialogContent aria-label="Form lokasi toko">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault()
                                setSaving(true)
                                try {
                                    if (editingStoreId) {
                                        await adminFetch(`/admin/stores/${editingStoreId}`, {
                                            method: 'PUT',
                                            body: JSON.stringify(storeForm),
                                        })
                                        toast({ title: 'Cabang diperbarui' })
                                    } else {
                                        await adminFetch('/admin/stores', {
                                            method: 'POST',
                                            body: JSON.stringify(storeForm),
                                        })
                                        toast({ title: 'Cabang ditambahkan & aktif di checkout' })
                                    }
                                    setStoreOpen(false)
                                    load()
                                } catch (err) {
                                    toast({
                                        title: 'Gagal menyimpan cabang',
                                        description: err instanceof Error ? err.message : 'Terjadi kesalahan',
                                        variant: 'destructive',
                                    })
                                } finally {
                                    setSaving(false)
                                }
                            }}
                            className="space-y-4"
                        >
                            <DialogHeader>
                                <DialogTitle>{editingStoreId ? 'Edit Cabang' : 'Tambah Cabang Baru'}</DialogTitle>
                            </DialogHeader>
                            <Input label="Nama Toko" placeholder="Topsell Surabaya" value={storeForm.name} onChange={(v) => setStoreForm((f) => ({ ...f, name: v }))} isRequired />
                            <Input label="Area / Kota" placeholder="Surabaya" value={storeForm.areaName} onChange={(v) => setStoreForm((f) => ({ ...f, areaName: v }))} isRequired />
                            <Input label="Alamat Lengkap" placeholder="Jl. Basuki Rahmat No. 12" value={storeForm.address} onChange={(v) => setStoreForm((f) => ({ ...f, address: v }))} isRequired />
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="secondary" onClick={() => setStoreOpen(false)}>Batal</Button>
                                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    if (mode === 'store-areas') {
        const saveAreas = async (next: StoreAreaItem[]) => {
            await adminFetch('/admin/settings', {
                method: 'PUT',
                body: JSON.stringify({ store_areas: next }),
            })
            setAreas(next)
            toast({ title: 'Store Areas disimpan' })
        }

        return (
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-body-regular text-text-secondary">
                        Daftar area cakupan layanan toko Topsell.
                    </p>
                    <Button variant="primary" size="medium" leadingIcon={RiAddLine} onClick={() => setAreaOpen(true)}>
                        Tambah Area
                    </Button>
                </div>

                <section className="overflow-hidden rounded-3xl border border-border-button-default bg-background-full">
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-body-regular">
                            <thead>
                                <tr className="border-b border-separator-border text-caption-1-semibold text-text-tertiary">
                                    <th className="px-5 py-3.5 text-start">Nama Area</th>
                                    <th className="px-4 py-3.5 text-start">Kota</th>
                                    <th className="px-4 py-3.5 text-start">Provinsi</th>
                                    <th className="px-4 py-3.5 text-center">Status</th>
                                    <th className="px-5 py-3.5 text-end">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-separator-border">
                                {areas.map((a) => (
                                    <tr key={a.id} className="hover:bg-background-secondary-hover/60">
                                        <td className="px-5 py-3.5 font-medium text-text-primary">{a.name}</td>
                                        <td className="px-4 py-3.5 text-text-secondary">{a.city}</td>
                                        <td className="px-4 py-3.5 text-text-secondary">{a.province}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            <button
                                                type="button"
                                                onClick={() => saveAreas(areas.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x)))}
                                            >
                                                <Chip variant="caption" color={a.active ? 'lime' : 'neutral'}>
                                                    {a.active ? 'Aktif' : 'Nonaktif'}
                                                </Chip>
                                            </button>
                                        </td>
                                        <td className="px-5 py-3.5 text-end">
                                            <Button
                                                variant="ghost"
                                                size="small"
                                                iconOnly
                                                leadingIcon={RiDeleteBinLine}
                                                aria-label={`Hapus ${a.name}`}
                                                onClick={() => saveAreas(areas.filter((x) => x.id !== a.id))}
                                                className="text-text-error-primary"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <Dialog open={areaOpen} onOpenChange={setAreaOpen}>
                    <DialogContent aria-label="Tambah area">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault()
                                await saveAreas([
                                    ...areas,
                                    { id: `area-${Date.now()}`, name: areaForm.name, city: areaForm.city, province: areaForm.province, active: true },
                                ])
                                setAreaForm({ name: '', city: '', province: 'Jawa Timur' })
                                setAreaOpen(false)
                            }}
                            className="space-y-4"
                        >
                            <DialogHeader>
                                <DialogTitle>Tambah Store Area</DialogTitle>
                            </DialogHeader>
                            <Input label="Nama Area" placeholder="Kediri" value={areaForm.name} onChange={(v) => setAreaForm((f) => ({ ...f, name: v }))} isRequired />
                            <Input label="Kota / Kabupaten" placeholder="Kediri" value={areaForm.city} onChange={(v) => setAreaForm((f) => ({ ...f, city: v }))} isRequired />
                            <Input label="Provinsi" placeholder="Jawa Timur" value={areaForm.province} onChange={(v) => setAreaForm((f) => ({ ...f, province: v }))} />
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="secondary" onClick={() => setAreaOpen(false)}>Batal</Button>
                                <Button type="submit" variant="primary">Simpan</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    // app-settings
    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault()
                setSaving(true)
                try {
                    await adminFetch('/admin/settings', {
                        method: 'PUT',
                        body: JSON.stringify({
                            app_settings: {
                                store_name: appForm.store_name,
                                support_whatsapp: appForm.support_whatsapp,
                                point_to_rupiah: Number(appForm.point_to_rupiah) || 1,
                                new_member_points: Number(appForm.new_member_points) || 0,
                                meta_your_pixel: appForm.meta_your_pixel,
                                body_script: appForm.body_script,
                                banner_imager: [],
                            },
                        }),
                    })
                    toast({ title: 'App Settings disimpan' })
                } catch (err) {
                    toast({
                        title: 'Gagal menyimpan pengaturan',
                        description: err instanceof Error ? err.message : 'Terjadi kesalahan',
                        variant: 'destructive',
                    })
                } finally {
                    setSaving(false)
                }
            }}
            className="max-w-2xl space-y-5 rounded-3xl border border-border-button-default bg-background-full p-5 sm:p-6"
        >
            <div>
                <h2 className="text-headline-semibold text-text-primary">Pengaturan Aplikasi</h2>
                <p className="text-caption-1-regular text-text-secondary">
                    Diteruskan langsung ke endpoint /app-settings dan perhitungan nilai tukar poin.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Nama Toko" value={appForm.store_name} onChange={(v) => setAppForm((f) => ({ ...f, store_name: v }))} />
                <Input label="WhatsApp CS" placeholder="628113000000" value={appForm.support_whatsapp} onChange={(v) => setAppForm((f) => ({ ...f, support_whatsapp: v }))} />
                <Input label="Nilai 1 Poin (Rp)" type="number" value={appForm.point_to_rupiah} onChange={(v) => setAppForm((f) => ({ ...f, point_to_rupiah: v }))} />
                <Input label="Bonus Poin Member Baru" type="number" value={appForm.new_member_points} onChange={(v) => setAppForm((f) => ({ ...f, new_member_points: v }))} />
            </div>

            <Textarea
                label="Meta Pixel / Head Script"
                rows={3}
                value={appForm.meta_your_pixel}
                onChange={(v) => setAppForm((f) => ({ ...f, meta_your_pixel: v }))}
            />
            <Textarea
                label="Body Script"
                rows={3}
                value={appForm.body_script}
                onChange={(v) => setAppForm((f) => ({ ...f, body_script: v }))}
            />

            <div className="flex justify-end">
                <Button type="submit" variant="primary" leadingIcon={RiSaveLine} disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
            </div>
        </form>
    )
}
