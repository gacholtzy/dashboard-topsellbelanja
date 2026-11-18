"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { RiRefreshLine } from '@remixicon/react'
import { Button } from '@/components/base/buttons/button'
import { Chip } from '@/components/base/badges/chip'
import { SearchField } from '@/components/base/search-field/search-field'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { useToast } from '@/hooks/use-toast'
import { adminFetch, formatRupiah, type AdminUser } from '@/lib/admin-api'

export function UsersSection({ onUnauthorized }: { onUnauthorized: () => void }) {
    const { toast } = useToast()
    const [users, setUsers] = useState<AdminUser[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
            setUsers(await adminFetch<AdminUser[]>(`/admin/users${q}`))
        } catch (err: unknown) {
            if ((err as { status?: number })?.status === 401) {
                onUnauthorized()
                return
            }
            toast({ title: 'Gagal memuat daftar user', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [search, onUnauthorized, toast])

    useEffect(() => {
        const id = setTimeout(() => load(), search ? 250 : 0)
        return () => clearTimeout(id)
    }, [load, search])

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchField
                    aria-label="Cari user"
                    placeholder="Cari nama, no. WhatsApp, atau email..."
                    value={search}
                    onChange={setSearch}
                    shape="rounded"
                    className="sm:max-w-sm"
                />
                <Button variant="secondary" size="medium" leadingIcon={RiRefreshLine} onClick={load}>
                    Segarkan ({users.length})
                </Button>
            </div>

            <section className="overflow-hidden rounded-3xl border border-border-button-default bg-background-full">
                {loading ? (
                    <div className="space-y-3 p-6">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} shape="rect" className="h-12 w-full" />
                        ))}
                    </div>
                ) : users.length === 0 ? (
                    <p className="p-8 text-center text-body-regular text-text-secondary">Belum ada user terdaftar.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-body-regular">
                            <thead>
                                <tr className="border-b border-separator-border text-caption-1-semibold text-text-tertiary">
                                    <th className="px-5 py-3.5 text-start">Nama</th>
                                    <th className="px-4 py-3.5 text-start">WhatsApp & Email</th>
                                    <th className="px-4 py-3.5 text-center">Order</th>
                                    <th className="px-4 py-3.5 text-end">Total Belanja</th>
                                    <th className="px-5 py-3.5 text-end">Poin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-separator-border">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-background-secondary-hover/60">
                                        <td className="px-5 py-3.5 font-medium text-text-primary">{u.fullName}</td>
                                        <td className="px-4 py-3.5">
                                            <p className="tabular-nums text-text-primary" dir="ltr">
                                                {u.phoneNumber}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-caption-1-regular text-text-secondary">
                                                    {u.email || 'Belum ada email'}
                                                </span>
                                                {u.email && (
                                                    <Chip variant="caption" color={u.isEmailValid ? 'lime' : 'neutral'}>
                                                        {u.isEmailValid ? 'Terverifikasi' : 'Belum verifikasi'}
                                                    </Chip>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-center tabular-nums text-text-primary">
                                            {u.orderCount}
                                        </td>
                                        <td className="px-4 py-3.5 text-end font-semibold tabular-nums text-text-primary">
                                            {formatRupiah(u.totalSpent)}
                                        </td>
                                        <td className="px-5 py-3.5 text-end tabular-nums text-text-primary">
                                            {u.points.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}
