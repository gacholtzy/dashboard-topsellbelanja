"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import {
    RiArrowDownSLine,
    RiArrowUpSLine,
    RiBankCardLine,
    RiCoupon3Line,
    RiExternalLinkLine,
    RiGiftLine,
    RiGroupLine,
    RiHome4Line,
    RiLogoutBoxRLine,
    RiMapPinLine,
    RiMenuLine,
    RiSettings3Line,
    RiShoppingBag3Line,
    RiStore2Line,
} from '@remixicon/react'
import { Button } from '@/components/base/buttons/button'
import { Chip } from '@/components/base/badges/chip'
import { Divider } from '@/components/base/divider/divider'
import { CloseButton } from '@/components/base/buttons/close-button'
import { cx } from '@/utils/cx'

export type AdminSectionKey =
    | 'overview'
    | 'orders'
    | 'vouchers'
    | 'voucher-create'
    | 'points-catalog'
    | 'points-adjust'
    | 'users'
    | 'postal-codes'
    | 'webhooks'
    | 'app-settings'
    | 'stores'
    | 'store-areas'
    | 'payment-methods'

const SECTION_TITLES: Record<AdminSectionKey, string> = {
    overview: 'Dashboard',
    orders: 'Order / Penjualan',
    vouchers: 'Daftar Voucher',
    'voucher-create': 'Buat Voucher',
    'points-catalog': 'Katalog Tukar Poin',
    'points-adjust': 'Kelola Poin User',
    users: 'Users',
    'postal-codes': 'Postal Code',
    webhooks: 'Webhooks',
    'app-settings': 'App Settings',
    stores: 'Store Locations',
    'store-areas': 'Store Areas',
    'payment-methods': 'Payment Method',
}

interface AdminShellProps {
    activeSection: AdminSectionKey
    onSelectSection: (section: AdminSectionKey) => void
    pendingOrderCount?: number
    onLogout: () => void
    children: React.ReactNode
}

export function AdminShell({
    activeSection,
    onSelectSection,
    pendingOrderCount = 0,
    onLogout,
    children,
}: AdminShellProps) {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [voucherOpen, setVoucherOpen] = useState(
        activeSection === 'vouchers' || activeSection === 'voucher-create'
    )
    const [poinOpen, setPoinOpen] = useState(
        activeSection === 'points-catalog' || activeSection === 'points-adjust'
    )
    const [settingsOpen, setSettingsOpen] = useState(true)

    const navigate = (key: AdminSectionKey) => {
        onSelectSection(key)
        setMobileOpen(false)
    }

    const itemClass = (active: boolean) =>
        cx(
            'flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-start transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring',
            active
                ? 'bg-background-secondary-default text-body-medium font-semibold text-text-primary'
                : 'text-body-regular text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary'
        )

    const subItemClass = (active: boolean) =>
        cx(
            'flex w-full items-center gap-3 rounded-xl py-2 pe-3 ps-5 text-start transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring',
            active
                ? 'bg-background-secondary-default text-body-medium font-semibold text-accent-600'
                : 'text-body-regular text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary'
        )

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            {/* Brand */}
            <div className="flex items-center justify-between gap-2 px-4 py-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-accent-600 text-white">
                        <RiStore2Line className="size-5" aria-hidden />
                    </div>
                    <div>
                        <p className="text-body-medium font-semibold text-text-primary">Topsell Admin</p>
                        <p className="text-caption-1-regular text-text-tertiary">Panel Penjualan</p>
                    </div>
                </div>
                <div className="lg:hidden">
                    <CloseButton aria-label="Tutup menu" onClick={() => setMobileOpen(false)} />
                </div>
            </div>

            <Divider />

            {/* Navigation */}
            <nav aria-label="Menu admin" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                <button
                    type="button"
                    onClick={() => navigate('overview')}
                    className={itemClass(activeSection === 'overview')}
                >
                    <span className="flex items-center gap-2.5">
                        <RiHome4Line className="size-4.5 shrink-0" aria-hidden />
                        <span>Dashboard</span>
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => navigate('orders')}
                    className={itemClass(activeSection === 'orders')}
                >
                    <span className="flex items-center gap-2.5">
                        <RiShoppingBag3Line className="size-4.5 shrink-0" aria-hidden />
                        <span>Order / Penjualan</span>
                    </span>
                    {pendingOrderCount > 0 && (
                        <Chip variant="caption" color="yellow">
                            {pendingOrderCount}
                        </Chip>
                    )}
                </button>

                {/* Voucher group */}
                <div>
                    <button
                        type="button"
                        onClick={() => setVoucherOpen((v) => !v)}
                        className={itemClass(
                            activeSection === 'vouchers' || activeSection === 'voucher-create'
                        )}
                        aria-expanded={voucherOpen}
                    >
                        <span className="flex items-center gap-2.5">
                            <RiCoupon3Line className="size-4.5 shrink-0" aria-hidden />
                            <span>Voucher</span>
                        </span>
                        {voucherOpen ? (
                            <RiArrowUpSLine className="size-4 shrink-0 text-text-tertiary" aria-hidden />
                        ) : (
                            <RiArrowDownSLine className="size-4 shrink-0 text-text-tertiary" aria-hidden />
                        )}
                    </button>
                    {voucherOpen && (
                        <div className="mt-1 space-y-0.5 ps-2">
                            <button
                                type="button"
                                onClick={() => navigate('vouchers')}
                                className={subItemClass(activeSection === 'vouchers')}
                            >
                                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                                <span>Daftar Voucher</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('voucher-create')}
                                className={subItemClass(activeSection === 'voucher-create')}
                            >
                                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                                <span>Buat Voucher</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Poin group */}
                <div>
                    <button
                        type="button"
                        onClick={() => setPoinOpen((v) => !v)}
                        className={itemClass(
                            activeSection === 'points-catalog' || activeSection === 'points-adjust'
                        )}
                        aria-expanded={poinOpen}
                    >
                        <span className="flex items-center gap-2.5">
                            <RiGiftLine className="size-4.5 shrink-0" aria-hidden />
                            <span>Poin</span>
                        </span>
                        {poinOpen ? (
                            <RiArrowUpSLine className="size-4 shrink-0 text-text-tertiary" aria-hidden />
                        ) : (
                            <RiArrowDownSLine className="size-4 shrink-0 text-text-tertiary" aria-hidden />
                        )}
                    </button>
                    {poinOpen && (
                        <div className="mt-1 space-y-0.5 ps-2">
                            <button
                                type="button"
                                onClick={() => navigate('points-catalog')}
                                className={subItemClass(activeSection === 'points-catalog')}
                            >
                                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                                <span>Katalog Tukar Poin</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('points-adjust')}
                                className={subItemClass(activeSection === 'points-adjust')}
                            >
                                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                                <span>Kelola Poin User</span>
                            </button>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => navigate('users')}
                    className={itemClass(activeSection === 'users')}
                >
                    <span className="flex items-center gap-2.5">
                        <RiGroupLine className="size-4.5 shrink-0" aria-hidden />
                        <span>Users</span>
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => navigate('postal-codes')}
                    className={itemClass(activeSection === 'postal-codes')}
                >
                    <span className="flex items-center gap-2.5">
                        <RiMapPinLine className="size-4.5 shrink-0" aria-hidden />
                        <span>Postal Code</span>
                    </span>
                </button>

                <div className="px-3 pb-1 pt-4">
                    <p className="text-caption-1-semibold text-text-tertiary">Settings</p>
                </div>

                {/* Settings group */}
                <div>
                    <button
                        type="button"
                        onClick={() => setSettingsOpen((v) => !v)}
                        className={itemClass(
                            ['webhooks', 'app-settings', 'stores', 'store-areas'].includes(activeSection)
                        )}
                        aria-expanded={settingsOpen}
                    >
                        <span className="flex items-center gap-2.5">
                            <RiSettings3Line className="size-4.5 shrink-0" aria-hidden />
                            <span>Settings</span>
                        </span>
                        {settingsOpen ? (
                            <RiArrowUpSLine className="size-4 shrink-0 text-text-tertiary" aria-hidden />
                        ) : (
                            <RiArrowDownSLine className="size-4 shrink-0 text-text-tertiary" aria-hidden />
                        )}
                    </button>
                    {settingsOpen && (
                        <div className="mt-1 space-y-0.5 ps-2">
                            <button
                                type="button"
                                onClick={() => navigate('webhooks')}
                                className={subItemClass(activeSection === 'webhooks')}
                            >
                                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                                <span>Webhooks</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('app-settings')}
                                className={subItemClass(activeSection === 'app-settings')}
                            >
                                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                                <span>App Settings</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('stores')}
                                className={subItemClass(activeSection === 'stores')}
                            >
                                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                                <span>Store Locations</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('store-areas')}
                                className={subItemClass(activeSection === 'store-areas')}
                            >
                                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                                <span>Store Areas</span>
                            </button>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => navigate('payment-methods')}
                    className={itemClass(activeSection === 'payment-methods')}
                >
                    <span className="flex items-center gap-2.5">
                        <RiBankCardLine className="size-4.5 shrink-0" aria-hidden />
                        <span>Payment Method</span>
                    </span>
                </button>
            </nav>

            <Divider />

            {/* Footer actions */}
            <div className="space-y-2 p-3">
                <a
                    href={process.env.NEXT_PUBLIC_CHECKOUT_URL || 'http://localhost:3000'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-between rounded-xl border border-border-button-default bg-background-secondary-default px-3 py-2 text-body-medium text-text-primary transition-colors hover:bg-background-secondary-hover"
                >
                    <span>Lihat Checkout</span>
                    <RiExternalLinkLine className="size-4 text-text-tertiary" aria-hidden />
                </a>
                <Button
                    variant="ghost"
                    size="medium"
                    leadingIcon={RiLogoutBoxRLine}
                    onClick={onLogout}
                    className="w-full justify-start text-text-error-primary"
                >
                    Keluar Admin
                </Button>
            </div>
        </div>
    )

    return (
        <div className="flex min-h-screen w-full bg-background-secondary-default/40">
            {/* Desktop Sidebar */}
            <aside className="hidden w-64 shrink-0 border-e border-separator-border bg-background-full lg:block">
                <div className="sticky top-0 h-screen">
                    <SidebarContent />
                </div>
            </aside>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div
                        className="fixed inset-0 bg-black/40"
                        aria-hidden
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="relative z-10 w-72 max-w-[85vw] bg-background-full shadow-xl">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-separator-border bg-background-full/95 px-4 py-3 backdrop-blur sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="inline-flex size-10 items-center justify-center rounded-xl border border-border-button-default bg-background-full text-text-primary hover:bg-background-secondary-hover lg:hidden"
                            aria-label="Buka menu navigasi"
                        >
                            <RiMenuLine className="size-5" aria-hidden />
                        </button>
                        <div className="min-w-0">
                            <h1 className="truncate text-title-3-semibold text-text-primary">
                                {SECTION_TITLES[activeSection]}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Chip variant="caption" color="lime">
                            Terhubung ke Checkout
                        </Chip>
                    </div>
                </header>

                <main className="mx-auto w-full min-w-0 max-w-[1280px] flex-1 p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
