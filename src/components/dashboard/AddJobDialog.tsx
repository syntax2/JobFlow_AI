"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JobApplication, JobPlatform, JobStatus } from '@/lib/context/types';
import { JOB_PLATFORMS, JOB_STATUSES } from '@/constants';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob: (jobData: Omit<JobApplication, 'id' | 'lastUpdated' | 'userId'>) => Promise<void>;
  initialData?: Partial<Omit<JobApplication, 'id' | 'lastUpdated'| 'userId'>>; // For editing
}

const initialFormState: Omit<JobApplication, 'id' | 'lastUpdated' | 'userId'> = {
  title: '',
  company: '',
  platform: JOB_PLATFORMS[0],
  status: JOB_STATUSES[0],
  link: '',
  notes: '',
  jobDescription: '',
  dateApplied: new Date().toISOString(),
};

export function AddJobDialog({ isOpen, onClose, onAddJob, initialData }: AddJobDialogProps) {
  const [formData, setFormData] = useState<Omit<JobApplication, 'id' | 'lastUpdated' | 'userId'>>(initialData || initialFormState);
  const [dateApplied, setDateApplied] = React.useState<Date | undefined>(
    initialData?.dateApplied ? new Date(initialData.dateApplied) : new Date()
  );

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setDateApplied(initialData.dateApplied ? new Date(initialData.dateApplied) : new Date());
    } else {
      setFormData(initialFormState);
      setDateApplied(new Date());
    }
  }, [initialData, isOpen]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: 'status' | 'platform') => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value as JobStatus | JobPlatform }));
  };
  
  React.useEffect(() => {
    if (dateApplied) {
      setFormData(prev => ({ ...prev, dateApplied: dateApplied.toISOString() }));
    }
  }, [dateApplied]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!formData.title || !formData.company) {
      alert("Title and Company are required."); // Replace with custom toast/notification
      return;
    }
    await onAddJob(formData);
    if (!initialData) { // Reset form only if it's for adding new, not editing
        setFormData(initialFormState);
        setDateApplied(new Date());
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Job Application" : "Add New Job Application"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update the details of this job application." : "Fill in the details of the job you're applying for."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Job Title
            </Label>
            <Input id="title" name="title" value={formData.title} onChange={handleChange} className="col-span-3" placeholder="e.g., Software Engineer" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">
              Company
            </Label>
            <Input id="company" name="company" value={formData.company} onChange={handleChange} className="col-span-3" placeholder="e.g., Google" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="platform" className="text-right">
              Platform
            </Label>
            <Select name="platform" value={formData.platform} onValueChange={handleSelectChange('platform')}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
              <SelectContent>
                {JOB_PLATFORMS.map(platform => (
                  <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dateApplied" className="text-right">
              Date Applied
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !dateApplied && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateApplied ? format(dateApplied, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateApplied}
                  onSelect={setDateApplied}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select name="status" value={formData.status} onValueChange={handleSelectChange('status')}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {JOB_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="link" className="text-right">
              Job Link
            </Label>
            <Input id="link" name="link" type="url" value={formData.link} onChange={handleChange} className="col-span-3" placeholder="https://example.com/job/123" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="jobDescription" className="text-right pt-2">
              Job Description
            </Label>
            <Textarea id="jobDescription" name="jobDescription" value={formData.jobDescription} onChange={handleChange} className="col-span-3 min-h-[100px]" placeholder="Paste job description here..." />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2">
              Notes
            </Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="col-span-3" placeholder="Any additional notes..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{initialData ? "Save Changes" : "Add Job"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
