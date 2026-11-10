'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  HardDrive,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Loader2,
  FileQuestion,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

interface OrphanItem {
  key: string;
  filename: string;
  size: number;
  formattedSize: string;
  lastModified: string;
  url: string;
}

interface ScanData {
  prefix: string;
  totalObjects: number;
  totalSize: number;
  formattedTotalSize: string;
  orphanCount: number;
  orphanSize: number;
  formattedOrphanSize: string;
  orphans: OrphanItem[];
  scannedAt: string;
}

export function R2MediaCleaner() {
  const [loading, setLoading] = useState(false);
  const [purging, setPurging] = useState(false);
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [includeRecent, setIncludeRecent] = useState(false);

  const handleScan = async (forceRecent?: boolean | any) => {
    const useRecent = typeof forceRecent === 'boolean' ? forceRecent : includeRecent;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/media/cleanup?minAgeMinutes=${useRecent ? 0 : 60}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setScanData(data);
        if (data.orphanCount === 0) {
          toast.success('Storage is completely clean! No orphan files found.');
        } else {
          toast.info(`Found ${data.orphanCount} unused file(s) taking ${data.formattedOrphanSize}.`);
        }
      } else {
        toast.error(data.message || 'Failed to scan Cloudflare R2 storage.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while scanning storage.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeSingle = async (item: OrphanItem) => {
    const confirm = await Swal.fire({
      title: 'Delete this unused image?',
      html: `Are you sure you want to permanently delete <b>${item.filename}</b> (${item.formattedSize}) from Cloudflare R2?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch('/api/admin/media/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: [item.key] }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Deleted ${item.filename}`);
        setScanData((prev) => {
          if (!prev) return null;
          const updatedOrphans = prev.orphans.filter((o) => o.key !== item.key);
          const newSize = Math.max(0, prev.orphanSize - item.size);
          return {
            ...prev,
            orphanCount: updatedOrphans.length,
            orphanSize: newSize,
            orphans: updatedOrphans,
          };
        });
      } else {
        toast.error(data.message || 'Failed to delete file.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while deleting file.');
    }
  };

  const handlePurgeAll = async () => {
    if (!scanData || scanData.orphanCount === 0) return;

    const confirm = await Swal.fire({
      title: 'Purge All Unused Images?',
      html: `You are about to permanently delete <b>${scanData.orphanCount} unreferenced file(s)</b> (${scanData.formattedOrphanSize}) from Cloudflare R2.<br/><br/><span style="color:#ef4444;font-size:13px;">This action is permanent and cannot be undone!</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Delete ${scanData.orphanCount} Files`,
      cancelButtonText: 'Cancel',
    });

    if (!confirm.isConfirmed) return;

    setPurging(true);
    try {
      const res = await fetch('/api/admin/media/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purgeAll: true,
          prefix: scanData.prefix,
          minAgeMinutes: includeRecent ? 0 : 60,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        await Swal.fire({
          title: 'Cleaned Up!',
          text: data.message || `Deleted ${data.deletedCount} unused files from Cloudflare R2.`,
          icon: 'success',
          confirmButtonColor: '#10b981',
        });
        handleScan();
      } else {
        toast.error(data.message || 'Failed to purge files.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while purging files.');
    } finally {
      setPurging(false);
    }
  };

  return (
    <Card className="w-full border-none shadow-2xl bg-card backdrop-blur-xl overflow-hidden rounded-3xl">
      <CardHeader className="bg-primary text-primary-foreground p-5 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-foreground/15 rounded-xl shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl md:text-2xl font-bold leading-tight">
                  Cloudflare R2 Media Storage & Auto-Cleaner
                </CardTitle>
                <Badge variant="outline" className="text-xs bg-primary-foreground/20 text-primary-foreground border-none">
                  Smart Scanner
                </Badge>
              </div>
              <CardDescription className="text-primary-foreground/80 text-xs md:text-sm mt-1">
                Scan and safely purge deleted products, blogs, and banner images from Cloudflare R2 bucket.
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => handleScan()}
              disabled={loading || purging}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold shadow-md rounded-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning R2...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Scan Unused Images
                </>
              )}
            </Button>

            {scanData && scanData.orphanCount > 0 && (
              <Button
                onClick={handlePurgeAll}
                disabled={loading || purging}
                variant="destructive"
                className="bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md rounded-xl transition-all"
              >
                {purging ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Purging...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Purge All ({scanData.orphanCount})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 md:p-8 space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border text-sm">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Safety Protection Window (60 Minutes)</p>
              <p className="text-xs text-muted-foreground">
                By default, files uploaded in the last 60 minutes are protected from deletion to avoid interfering with active drafting.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={includeRecent}
              onChange={(e) => {
                const nextVal = e.target.checked;
                setIncludeRecent(nextVal);
                if (scanData) handleScan(nextVal);
              }}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4"
            />
            Include Recent Drafts
          </label>
        </div>

        {scanData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/40 rounded-2xl border border-border">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Objects in R2</p>
              <p className="text-2xl font-bold text-foreground mt-1">{scanData.totalObjects}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{scanData.formattedTotalSize}</p>
            </div>

            <div className="p-4 bg-muted/40 rounded-2xl border border-border">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Unused (Orphan) Files</p>
              <p className={`text-2xl font-bold mt-1 ${scanData.orphanCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {scanData.orphanCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Ready to clean</p>
            </div>

            <div className="p-4 bg-muted/40 rounded-2xl border border-border">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reclaimable Storage</p>
              <p className="text-2xl font-bold text-foreground mt-1">{scanData.formattedOrphanSize}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Wasted space</p>
            </div>

            <div className="p-4 bg-muted/40 rounded-2xl border border-border">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Storage Prefix</p>
              <p className="text-lg font-mono font-bold text-foreground mt-1 truncate" title={scanData.prefix}>
                {scanData.prefix}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Isolated scope</p>
            </div>
          </div>
        )}

        {scanData && scanData.orphans.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-amber-500" />
                Unreferenced Images Found ({scanData.orphans.length})
              </h4>
              <span className="text-xs text-muted-foreground">
                Last Scanned: {new Date(scanData.scannedAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 rounded-2xl border border-border p-2 bg-muted/20">
              {scanData.orphans.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 p-3 bg-card rounded-xl border border-border/80 hover:border-primary/40 transition-all text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0 relative border border-border">
                      <Image
                        src={item.url}
                        alt={item.filename}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate max-w-[280px] md:max-w-[420px]" title={item.filename}>
                        {item.filename}
                      </p>
                      <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                        <span>{item.formattedSize}</span>
                        <span>•</span>
                        <span>{new Date(item.lastModified).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all"
                      title="Preview in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePurgeSingle(item)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 px-2.5 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scanData && scanData.orphanCount === 0 && (
          <div className="text-center py-8 px-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="font-bold text-foreground text-base">Your Cloudflare R2 Storage is Completely Clean!</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Every image in your R2 bucket is actively used across your products, categories, blogs, or banners.
            </p>
          </div>
        )}

        {!scanData && !loading && (
          <div className="text-center py-8 px-4 bg-muted/30 rounded-2xl border border-dashed border-border">
            <Database className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-60" />
            <h4 className="font-semibold text-foreground text-sm">Ready to Audit Storage</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Click &apos;Scan Unused Images&apos; above to find leftover or orphaned photos from deleted items.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

