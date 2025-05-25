
"use client";

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit2, Trash2, ExternalLink, Eye } from 'lucide-react';
import type { JobApplication, JobStatus } from '@/lib/context/types';
import { JOB_STATUSES } from '@/constants';
import { format, parseISO } from 'date-fns';
import { AddJobDialog } from './AddJobDialog'; // For editing
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Link from 'next/link';

interface JobApplicationTableProps {
  applications: JobApplication[];
  loading: boolean;
  onUpdate: (id: string, updatedData: Partial<JobApplication>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function JobApplicationTable({ applications, loading, onUpdate, onDelete }: JobApplicationTableProps) {
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = (job: JobApplication) => {
    setEditingJob(job);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedData: Omit<JobApplication, 'id' | 'lastUpdated' | 'userId'>) => {
    if (editingJob) {
      await onUpdate(editingJob.id, updatedData);
    }
    setIsEditDialogOpen(false);
    setEditingJob(null);
  };
  
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'Applied': return 'bg-blue-500 hover:bg-blue-600';
      case 'Interview Scheduled': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Offer Received': return 'bg-green-500 hover:bg-green-600';
      case 'Rejected': return 'bg-red-500 hover:bg-red-600';
      case 'Not Applied': return 'bg-gray-500 hover:bg-gray-600';
      case 'Follow-up Sent': return 'bg-purple-500 hover:bg-purple-600';
      case 'Wishlist': return 'bg-pink-500 hover:bg-pink-600';
      default: return 'bg-primary hover:bg-primary/90';
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No job applications found. Add your first one!</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Job Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Date Applied</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">
                <Link href={`/dashboard/jobs/${job.id}`} className="hover:underline text-primary">
                  {job.title}
                </Link>
              </TableCell>
              <TableCell>{job.company}</TableCell>
              <TableCell>
                <Badge variant="secondary">{job.platform}</Badge>
              </TableCell>
              <TableCell>
                {job.dateApplied ? format(parseISO(job.dateApplied), 'MMM d, yyyy') : 'N/A'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Badge className={`cursor-pointer text-white ${getStatusColor(job.status)}`}>
                       {job.status}
                     </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {JOB_STATUSES.map((statusOption) => (
                      <DropdownMenuItem
                        key={statusOption}
                        onClick={() => onUpdate(job.id, { status: statusOption })}
                        disabled={job.status === statusOption}
                      >
                        {statusOption}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEdit(job)}>
                      <Edit2 className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <Link href={`/dashboard/jobs/${job.id}`} passHref>
                       <DropdownMenuItem>
                         <Eye className="mr-2 h-4 w-4" /> View Details
                       </DropdownMenuItem>
                    </Link>
                    {job.link && (
                      <DropdownMenuItem asChild>
                        <a href={job.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" /> View Job Post
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the job application
                            titled "{job.title}" from {job.company}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(job.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editingJob && (
        <AddJobDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onAddJob={handleSaveEdit} // Re-using AddJobDialog's onAddJob prop for saving edits
          initialData={editingJob}
        />
      )}
    </>
  );
}
