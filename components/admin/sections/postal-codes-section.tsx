"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { RiAddLine, RiDeleteBinLine, RiRefreshLine } from '@remixicon/react'
import { Button } from '@/components/base/buttons/button'
import { Chip } from '@/components/base/badges/chip'
import { Input } from '@/components/base/input/input'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { adminFetch, type AdminPostalCode } from '@/lib/admin-api'

export function PostalCodesSection({ onUnauthorized }: { onUnauthorized: () => void }) {
    const { toast } = useToast()
    const [items, setItems] = useState<AdminPostalCode[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [prefixOrCode, setPrefixOrCode] = useState('')
    const [city, setCity] = useState('')
    const [province, setProvince] = useState('Jawa Timur')
    const [saving, setSaving] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            setItems(await adminFetch<AdminPostalCode[]>('/admin/postal-codes'))
        } catch (err: unknown) {
            if ((err as { status?: number })?.status === 401) {
                onUnauthorized()
                return
            }
            toast({ title: 'Gagal memuat kode pos', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [onUnauthorized, toast])

    useEffect(() => {
        load()
    }, [load])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            await adminFetch('/admin/postal-codes', {
                method: 'POST',
                body: JSON.stringify({ prefixOrCode, city, province }),
            })
            toast({ title: 'Kode pos ditambahkan & langsung aktif di checkout' })
            setPrefixOrCode('')
            setCity('')
            setModalOpen(false)
            load()
        } catch (err) {
            toast({
                title: 'Gagal menambah kode pos',
                description: err instanceof Error ? err.message : 'Terjadi kesalahan',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    const toggleActive = async (item: AdminPostalCode) => {
        await adminFetch(`/admin/postal-codes/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({ isActive: !item.isActive }),
        })
        load()
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-body-regular text-text-secondary">
                    Prefix/kode pos di sini menentukan apakah alamat pembeli masuk area Topsell (gratis ongkir &ldquo;Diantar ke Alamat&rdquo;).
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="medium" leadingIcon={RiRefreshLine} onClick={load}>
                        Segarkan
                    </Button>
                    <Button variant="primary" size="medium" leadingIcon={RiAddLine} onClick={() => setModalOpen(true)}>
                        Tambah Kode Pos
                    </Button>
                </div>
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
                                    <th className="px-5 py-3.5 text-start">Prefix / Kode Pos</th>
                                    <th className="px-4 py-3.5 text-start">Kota / Kabupaten</th>
                                    <th className="px-4 py-3.5 text-start">Provinsi</th>
                                    <th className="px-4 py-3.5 text-center">Status</th>
                                    <th className="px-5 py-3.5 text-end">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-separator-border">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-background-secondary-hover/60">
                                        <td className="px-5 py-3.5 font-semibold tabular-nums text-text-primary" dir="ltr">
                                            {item.prefixOrCode}
                                        </td>
                                        <td className="px-4 py-3.5 text-text-primary">{item.city || '-'}</td>
                                        <td className="px-4 py-3.5 text-text-secondary">{item.province || '-'}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            <button type="button" onClick={() => toggleActive(item)}>
                                                <Chip variant="caption" color={item.isActive ? 'lime' : 'neutral'}>
                                                    {item.isActive ? 'Aktif' : 'Nonaktif'}
                                                </Chip>
                                            </button>
                                        </td>
                                        <td className="px-5 py-3.5 text-end">
                                            <Button
                                                variant="ghost"
                                                size="small"
                                                iconOnly
                                                leadingIcon={RiDeleteBinLine}
                                                aria-label={`Hapus ${item.prefixOrCode}`}
                                                onClick={async () => {
                                                    await adminFetch(`/admin/postal-codes/${item.id}`, { method: 'DELETE' })
                                                    toast({ title: 'Kode pos dihapus' })
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

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent aria-label="Tambah kode pos">
                    <form onSubmit={handleAdd} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>Tambah Kode Pos Area Topsell</DialogTitle>
                            <DialogDescription>Masukkan 3 digit prefix (mis. 612) atau 5 digit kode pos penuh.</DialogDescription>
                        </DialogHeader>
                        <Input
                            label="Prefix / Kode Pos"
                            placeholder="612"
                            value={prefixOrCode}
                            onChange={setPrefixOrCode}
                            isRequired
                        />
                        <Input label="Kota / Kabupaten" placeholder="Sidoarjo" value={city} onChange={setCity} />
                        <Input label="Provinsi" placeholder="Jawa Timur" value={province} onChange={setProvince} />
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
