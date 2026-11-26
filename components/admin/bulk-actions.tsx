"use client"

import React from 'react'
import { RiCloseLine } from '@remixicon/react'
import { Button } from '@/components/base/buttons/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/** Bar yang muncul saat ada baris terpilih: jumlah terpilih, aksi massal, dan tombol batal pilih. */
export function BulkActionBar({
    count,
    onClear,
    children,
}: {
    count: number
    onClear: () => void
    children: React.ReactNode
}) {
    if (count === 0) return null
    return (
        <div
            role="region"
            aria-label="Aksi massal"
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-accent-600/30 bg-accent-50 px-4 py-3"
        >
            <span className="text-body-medium font-semibold text-text-primary">{count} dipilih</span>
            <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
            <Button variant="ghost" size="small" leadingIcon={RiCloseLine} onClick={onClear}>
                Batal pilih
            </Button>
        </div>
    )
}

/** Konfirmasi sebelum aksi yang tidak bisa dibatalkan (hapus massal). */
export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    loading,
    onConfirm,
    onCancel,
}: {
    open: boolean
    title: string
    description: string
    confirmLabel: string
    loading?: boolean
    onConfirm: () => void
    onCancel: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && !loading && onCancel()}>
            <DialogContent aria-label={title}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pb-1 pt-2">
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="button" variant="danger" onClick={onConfirm} disabled={loading}>
                        {loading ? 'Memproses...' : confirmLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export interface BulkResult {
    affected: number
    failed: { invoice?: string; id?: string; message: string }[]
}
