"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils/dates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

interface LeadHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
}

interface HistoryEntry {
  id: string;
  created_at: string;
  action: string;
  description: string;
  user_id: string;
  user: {
    full_name: string;
  };
}

export function LeadHistoryModal({ isOpen, onClose, leadId }: LeadHistoryModalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!leadId) return;

      try {
        const { data, error } = await supabase
          .from('lead_history')
          .select(`
            *,
            user:users(full_name)
          `)
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching lead history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchHistory();
    }
  }, [leadId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Historial del Lead</DialogTitle>
          <DialogDescription>
            Registro de todas las acciones realizadas sobre este lead
          </DialogDescription>
        </DialogHeader>
        <Separator className="my-4" />
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No hay registros de historial
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {formatDateTime(entry.created_at)}
                  </TableCell>
                  <TableCell>{entry.action}</TableCell>
                  <TableCell>{entry.user?.full_name}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
} 