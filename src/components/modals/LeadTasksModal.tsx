"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils/dates';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface LeadTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'completed';
  created_at: string;
  assigned_to: string;
  user: {
    full_name: string;
  };
}

export function LeadTasksModal({ isOpen, onClose, leadId }: LeadTasksModalProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
  });
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    const fetchTasks = async () => {
      if (!leadId) return;

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            user:users(full_name)
          `)
          .eq('lead_id', leadId)
          .order('due_date', { ascending: true });

        if (error) throw error;
        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error("Error al cargar las tareas");
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchTasks();
    }
  }, [leadId, isOpen]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !leadId) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            ...newTask,
            lead_id: leadId,
            assigned_to: user.id,
            status: 'pending',
          },
        ])
        .select(`
          *,
          user:users(full_name)
        `)
        .single();

      if (error) throw error;

      setTasks([...tasks, data]);
      setNewTask({
        title: '',
        description: '',
        due_date: '',
      });

      // Registrar en el historial
      await supabase.from('lead_history').insert({
        lead_id: leadId,
        action: 'task_created',
        description: `Nueva tarea creada: ${newTask.title}`,
        user_id: user.id,
      });

      toast.success("Tarea creada exitosamente");

    } catch (error) {
      console.error('Error creating task:', error);
      toast.error("Error al crear la tarea");
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: Task['status']) => {
    if (!user?.id) return;

    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      // Registrar en el historial
      await supabase.from('lead_history').insert({
        lead_id: leadId,
        action: 'task_status_changed',
        description: `Tarea "${data.title}" marcada como ${newStatus === 'completed' ? 'completada' : 'pendiente'}`,
        user_id: user.id,
      });

      toast.success(`Tarea marcada como ${newStatus === 'completed' ? 'completada' : 'pendiente'}`);

    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error("Error al actualizar el estado de la tarea");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Tareas del Lead</DialogTitle>
          <DialogDescription>
            Gestiona las tareas asociadas a este lead
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Título de la tarea"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Fecha límite</Label>
                  <Input
                    type="datetime-local"
                    id="due_date"
                    required
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Descripción de la tarea"
                />
              </div>
              <Button type="submit" className="w-full">
                Crear Tarea
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-4" />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Fecha límite</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Badge
                    variant={task.status === 'completed' ? 'default' : 'secondary'}
                  >
                    {task.status === 'completed' ? 'Completada' : 'Pendiente'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{formatDate(task.due_date)}</TableCell>
                <TableCell>{task.user?.full_name}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleTaskStatus(task.id, task.status)}
                  >
                    {task.status === 'completed' ? 'Marcar como pendiente' : 'Marcar como completada'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
} 