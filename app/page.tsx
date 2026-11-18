"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { RiArrowLeftLine, RiLockLine, RiStore2Line } from '@remixicon/react'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { AdminShell, type AdminSectionKey } from '@/components/admin/admin-shell'
import { OrdersSection } from '@/components/admin/sections/orders-section'
import { OverviewSection } from '@/components/admin/sections/overview-section'
import { PaymentMethodsSection } from '@/components/admin/sections/payment-methods-section'
import { PointsSection } from '@/components/admin/sections/points-section'
import { PostalCodesSection } from '@/components/admin/sections/postal-codes-section'
import { SettingsSection } from '@/components/admin/sections/settings-section'
import { UsersSection } from '@/components/admin/sections/users-section'
import { VouchersSection } from '@/components/admin/sections/vouchers-section'
import { useToast } from '@/hooks/use-toast'
import {
    adminFetch,
    clearAdminToken,
    getAdminToken,
    setAdminToken,
    type AdminOverview,
} from '@/lib/admin-api'

export default function AdminPage() {
    const { toast } = useToast()
    const [hydrated, setHydrated] = useState(false)
    const [authed, setAuthed] = useState(false)
    const [password, setPassword] = useState('')
    const [loggingIn, setLoggingIn] = useState(false)
    const [activeSection, setActiveSection] = useState<AdminSectionKey>('overview')
    const [pendingCount, setPendingCount] = useState(0)

    useEffect(() => {
        const token = getAdminToken()
        setAuthed(Boolean(token))
        setHydrated(true)
    }, [])

    const refreshPendingCount = async () => {
        try {
            const ov = await adminFetch<AdminOverview>('/admin/overview')
            setPendingCount((ov.metrics?.pendingOrders ?? 0) + (ov.metrics?.activeOrders ?? 0))
        } catch {
            // handled by individual sections
        }
    }

    useEffect(() => {
        if (authed) refreshPendingCount()
    }, [authed])

    const handleUnauthorized = () => {
        clearAdminToken()
        setAuthed(false)
        toast({ title: 'Sesi admin berakhir', description: 'Silakan masuk kembali.' })
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoggingIn(true)
        try {
            const res = await adminFetch<{ token: string }>(
                '/admin/login',
                {
                    method: 'POST',
                    body: JSON.stringify({ password }),
                },
                ''
            )
            setAdminToken(res.token)
            setAuthed(true)
            setPassword('')
            toast({ title: 'Berhasil masuk ke Admin Dashboard' })
        } catch (err) {
            toast({
                title: 'Login gagal',
                description: err instanceof Error ? err.message : 'Password salah',
                variant: 'destructive',
            })
        } finally {
            setLoggingIn(false)
        }
    }

    if (!hydrated) {
        return <div className="min-h-screen bg-background-secondary-default/40" />
    }

    if (!authed) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background-secondary-default/40 px-4 py-12">
                <div className="w-full max-w-md rounded-3xl border border-border-button-default bg-background-full p-6 sm:p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-accent-600 text-white">
                            <RiStore2Line className="size-6" aria-hidden />
                        </div>
                        <div>
                            <h1 className="text-title-2-semibold text-text-primary">Topsell Admin</h1>
                            <p className="text-caption-1-regular text-text-secondary">
                                Dashboard pengelolaan penjualan & checkout
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            label="Password Admin"
                            type="password"
                            placeholder="Masukkan password admin"
                            leadingIcon={RiLockLine}
                            value={password}
                            onChange={setPassword}
                            isRequired
                        />

                        <p className="text-caption-1-regular text-text-tertiary">
                            Default pengembangan lokal (DEV_MODE): <code className="font-semibold text-text-primary">admin123</code>
                        </p>

                        <Button
                            type="submit"
                            variant="primary"
                            size="medium"
                            disabled={loggingIn || !password}
                            className="min-h-11 w-full"
                        >
                            {loggingIn ? 'Memeriksa...' : 'Masuk Dashboard'}
                        </Button>
                    </form>

                    <div className="mt-6 border-t border-separator-border pt-4 text-center">
                        <a
                            href={process.env.NEXT_PUBLIC_CHECKOUT_URL || 'http://localhost:3000'}
                            className="inline-flex items-center gap-1.5 text-body-medium text-text-secondary hover:text-text-primary"
                        >
                            <RiArrowLeftLine className="size-4" aria-hidden />
                            Buka Halaman Checkout
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <AdminShell
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            pendingOrderCount={pendingCount}
            onLogout={() => {
                clearAdminToken()
                setAuthed(false)
            }}
        >
            {activeSection === 'overview' && (
                <OverviewSection onNavigate={setActiveSection} onUnauthorized={handleUnauthorized} />
            )}
            {activeSection === 'orders' && (
                <OrdersSection onUnauthorized={handleUnauthorized} onOrdersChanged={refreshPendingCount} />
            )}
            {(activeSection === 'vouchers' || activeSection === 'voucher-create') && (
                <VouchersSection
                    startInCreateMode={activeSection === 'voucher-create'}
                    onDoneCreateMode={() => setActiveSection('vouchers')}
                    onUnauthorized={handleUnauthorized}
                />
            )}
            {activeSection === 'points-catalog' && (
                <PointsSection mode="catalog" onUnauthorized={handleUnauthorized} />
            )}
            {activeSection === 'points-adjust' && (
                <PointsSection mode="adjust" onUnauthorized={handleUnauthorized} />
            )}
            {activeSection === 'users' && <UsersSection onUnauthorized={handleUnauthorized} />}
            {activeSection === 'postal-codes' && (
                <PostalCodesSection onUnauthorized={handleUnauthorized} />
            )}
            {(activeSection === 'webhooks' ||
                activeSection === 'app-settings' ||
                activeSection === 'stores' ||
                activeSection === 'store-areas') && (
                <SettingsSection mode={activeSection} onUnauthorized={handleUnauthorized} />
            )}
            {activeSection === 'payment-methods' && (
                <PaymentMethodsSection onUnauthorized={handleUnauthorized} />
            )}
        </AdminShell>
    )
}
