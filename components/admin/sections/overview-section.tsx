"use client"

import React, { useEffect, useState } from 'react'
import {
    RiArrowRightLine,
    RiBankCardLine,
    RiGroupLine,
    RiRefreshLine,
    RiShoppingBag3Line,
    RiTimeLine,
} from '@remixicon/react'
import { Button } from '@/components/base/buttons/button'
import { Chip, type ChipColor } from '@/components/base/badges/chip'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { adminFetch, formatRupiah, type AdminOverview } from '@/lib/admin-api'
import type { AdminSectionKey } from '../admin-shell'

const STATUS_META: Record<string, { label: string; color: ChipColor }> = {
    pending: { label: 'Belum Bayar', color: 'yellow' },
    proses: { label: 'Diproses', color: 'blue' },
    sent: { label: 'Dikirim', color: 'cyan' },
    complete: { label: 'Selesai', color: 'lime' },
    expired: { label: 'Kadaluarsa', color: 'neutral' },
}

export function OverviewSection({
    onNavigate,
    onUnauthorized,
}: {
    onNavigate: (section: AdminSectionKey) => void
    onUnauthorized: () => void
}) {
    const [data, setData] = useState<AdminOverview | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const load = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await adminFetch<AdminOverview>('/admin/overview')
            setData(res)
        } catch (err: unknown) {
            if ((err as { status?: number })?.status === 401) {
                onUnauthorized()
                return
            }
            setError(err instanceof Error ? err.message : 'Gagal memuat ringkasan')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading) {
        return (
            <div className="space-y-6" aria-busy="true">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-3xl border border-border-button-default bg-background-full p-5">
                            <Skeleton shape="text" className="h-4 w-24" />
                            <Skeleton shape="text" className="mt-3 h-7 w-36" />
                            <Skeleton shape="text" className="mt-2 h-3.5 w-28" />
                        </div>
                    ))}
                </div>
                <div className="rounded-3xl border border-border-button-default bg-background-full p-6">
                    <Skeleton shape="rect" className="h-56 w-full" />
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="rounded-3xl border border-border-button-default bg-background-full p-8 text-center">
                <p className="text-body-medium text-text-error-primary">{error || 'Data tidak tersedia'}</p>
                <Button variant="primary" size="medium" leadingIcon={RiRefreshLine} onClick={load} className="mt-4">
                    Coba Lagi
                </Button>
            </div>
        )
    }

    const { metrics, chart, recentOrders } = data
    const maxRevenue = Math.max(1, ...chart.map((c) => c.revenue))
    const maxOrders = Math.max(1, ...chart.map((c) => c.orders))

    const kpis = [
        {
            label: 'Total Omzet',
            value: formatRupiah(metrics.totalRevenue),
            hint: `${metrics.completedOrders} selesai · ${metrics.activeOrders} berjalan`,
            icon: RiBankCardLine,
        },
        {
            label: 'Total Pesanan',
            value: metrics.totalOrders.toLocaleString('id-ID'),
            hint: `${metrics.expiredOrders} kadaluarsa`,
            icon: RiShoppingBag3Line,
        },
        {
            label: 'Menunggu Bayar & Proses',
            value: (metrics.pendingOrders + metrics.activeOrders).toLocaleString('id-ID'),
            hint: `${metrics.pendingOrders} belum bayar · ${metrics.activeOrders} aktif`,
            icon: RiTimeLine,
        },
        {
            label: 'Users & Poin Beredar',
            value: metrics.totalUsers.toLocaleString('id-ID'),
            hint: `${metrics.totalPoints.toLocaleString('id-ID')} poin aktif`,
            icon: RiGroupLine,
        },
    ]

    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => (
                    <div
                        key={kpi.label}
                        className="rounded-3xl border border-border-button-default bg-background-full p-5"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-caption-1-medium text-text-secondary">{kpi.label}</span>
                            <span className="flex size-9 items-center justify-center rounded-xl bg-background-secondary-default text-text-secondary">
                                <kpi.icon className="size-4.5" aria-hidden />
                            </span>
                        </div>
                        <p className="mt-3 text-title-2-semibold tabular-nums text-text-primary">{kpi.value}</p>
                        <p className="mt-1 text-caption-1-regular text-text-tertiary">{kpi.hint}</p>
                    </div>
                ))}
            </div>

            {/* Chart & Status Breakdown */}
            <div className="grid gap-6 lg:grid-cols-3">
                <section className="rounded-3xl border border-border-button-default bg-background-full p-5 sm:p-6 lg:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-headline-semibold text-text-primary">Tren Penjualan 7 Hari</h2>
                            <p className="text-caption-1-regular text-text-secondary">
                                Omzet harian (pesanan dibayar) dan jumlah pesanan masuk
                            </p>
                        </div>
                        <Button variant="ghost" size="small" leadingIcon={RiRefreshLine} onClick={load}>
                            Segarkan
                        </Button>
                    </div>

                    <div className="mt-6 grid h-52 grid-cols-7 items-end gap-2 sm:gap-4">
                        {chart.map((day) => {
                            const revPct = Math.max(6, Math.round((day.revenue / maxRevenue) * 100))
                            const ordPct = Math.max(6, Math.round((day.orders / maxOrders) * 100))
                            return (
                                <div key={day.label} className="group flex h-full flex-col items-center justify-end gap-2">
                                    <div className="flex h-40 w-full items-end justify-center gap-1">
                                        <div
                                            className="w-3 rounded-t-md bg-accent-600 transition-all sm:w-4"
                                            style={{ height: `${day.revenue > 0 ? revPct : 4}%` }}
                                            title={`${day.label}: ${formatRupiah(day.revenue)}`}
                                        />
                                        <div
                                            className="w-2 rounded-t-md bg-chart-2 transition-all sm:w-3"
                                            style={{ height: `${day.orders > 0 ? ordPct : 4}%` }}
                                            title={`${day.label}: ${day.orders} pesanan`}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-caption-1-medium tabular-nums text-text-primary">{day.orders}</p>
                                        <p className="text-[11px] text-text-tertiary">{day.label}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                <section className="rounded-3xl border border-border-button-default bg-background-full p-5 sm:p-6">
                    <h2 className="text-headline-semibold text-text-primary">Ringkasan Status</h2>
                    <p className="text-caption-1-regular text-text-secondary">Distribusi pesanan saat ini</p>

                    <div className="mt-5 space-y-3.5">
                        {[
                            { label: 'Belum Bayar', count: metrics.pendingOrders, color: 'yellow' as ChipColor },
                            { label: 'Diproses / Dikirim', count: metrics.activeOrders, color: 'blue' as ChipColor },
                            { label: 'Selesai', count: metrics.completedOrders, color: 'lime' as ChipColor },
                            { label: 'Kadaluarsa', count: metrics.expiredOrders, color: 'neutral' as ChipColor },
                        ].map((row) => {
                            const pct = metrics.totalOrders
                                ? Math.round((row.count / metrics.totalOrders) * 100)
                                : 0
                            return (
                                <div key={row.label} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-body-regular">
                                        <Chip variant="caption" color={row.color}>
                                            {row.label}
                                        </Chip>
                                        <span className="font-medium tabular-nums text-text-primary">
                                            {row.count} ({pct}%)
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-background-secondary-default">
                                        <div
                                            className="h-full rounded-full bg-accent-600 transition-all"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-6">
                        <Button
                            variant="secondary"
                            size="medium"
                            trailingIcon={RiArrowRightLine}
                            onClick={() => onNavigate('orders')}
                            className="w-full"
                        >
                            Kelola Semua Order
                        </Button>
                    </div>
                </section>
            </div>

            {/* Recent Orders */}
            <section className="rounded-3xl border border-border-button-default bg-background-full">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-separator-border px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="text-headline-semibold text-text-primary">Pesanan Terbaru</h2>
                        <p className="text-caption-1-regular text-text-secondary">
                            Pesanan yang baru dibuat dari halaman checkout
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        size="small"
                        trailingIcon={RiArrowRightLine}
                        onClick={() => onNavigate('orders')}
                    >
                        Lihat Semua
                    </Button>
                </div>

                {recentOrders.length === 0 ? (
                    <p className="p-8 text-center text-body-regular text-text-secondary">
                        Belum ada pesanan masuk.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-body-regular">
                            <thead>
                                <tr className="border-b border-separator-border text-caption-1-semibold text-text-tertiary">
                                    <th className="px-5 py-3 text-start sm:px-6">Invoice</th>
                                    <th className="px-4 py-3 text-start">Pembeli</th>
                                    <th className="px-4 py-3 text-start">Pengiriman</th>
                                    <th className="px-4 py-3 text-end">Total</th>
                                    <th className="px-5 py-3 text-end sm:px-6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-separator-border">
                                {recentOrders.map((order) => {
                                    const meta = STATUS_META[order.status] || { label: order.status, color: 'neutral' as ChipColor }
                                    return (
                                        <tr
                                            key={order.id}
                                            className="cursor-pointer transition-colors hover:bg-background-secondary-hover"
                                            onClick={() => onNavigate('orders')}
                                        >
                                            <td className="px-5 py-3.5 font-medium tabular-nums text-text-primary sm:px-6" dir="ltr">
                                                {order.invoice}
                                            </td>
                                            <td className="px-4 py-3.5 text-text-secondary">
                                                {order.name || order.phone || '-'}
                                            </td>
                                            <td className="px-4 py-3.5 text-text-secondary">
                                                {order.shipping?.title || '-'}
                                            </td>
                                            <td className="px-4 py-3.5 text-end font-semibold tabular-nums text-text-primary">
                                                {formatRupiah(order.total)}
                                            </td>
                                            <td className="px-5 py-3.5 text-end sm:px-6">
                                                <Chip variant="caption" color={meta.color}>
                                                    {meta.label}
                                                </Chip>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}
