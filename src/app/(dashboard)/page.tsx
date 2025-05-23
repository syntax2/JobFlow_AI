"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ListFilter, Search } from 'lucide-react';
import { AddJobDialog } from '@/components/dashboard/AddJobDialog';
import { JobApplicationTable } from '@/components/dashboard/JobApplicationTable';
import type { JobApplication } from '@/lib/context/types';
import { useFirebase } from '@/lib/firebase/FirebaseProvider';
import { collection, onSnapshot, query, where, doc, setDoc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JOB_STATUSES, JOB_PLATFORMS } from '@/constants';

export default function DashboardPage() {
  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { db, userId, appId } = useFirebase();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');

  useEffect(() => {
    if (!db || !userId || !appId) {
      setLoading(false);
      setJobApplications([]);
      return;
    }

    setLoading(true);
    const jobsColPath = `artifacts/${appId}/users/${userId}/jobApplications`;
    const q = query(collection(db, jobsColPath));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedJobs: JobApplication[] = [];
      querySnapshot.forEach((doc) => {
        fetchedJobs.push({ id: doc.id, ...doc.data() } as JobApplication);
      });
      // Sort in memory (e.g., by lastUpdated descending)
      fetchedJobs.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      setJobApplications(fetchedJobs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching job applications:", error);
      toast({ title: "Error", description: "Could not fetch job applications.", variant: "destructive" });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, appId, toast]);

  const handleAddJob = async (jobData: Omit<JobApplication, 'id' | 'lastUpdated' | 'userId'>) => {
    if (!db || !userId || !appId) return;
    try {
      const jobsColPath = `artifacts/${appId}/users/${userId}/jobApplications`;
      await addDoc(collection(db, jobsColPath), {
        ...jobData,
        userId,
        dateApplied: jobData.dateApplied ? Timestamp.fromDate(new Date(jobData.dateApplied)).toDate().toISOString() : Timestamp.now().toDate().toISOString(),
        lastUpdated: Timestamp.now().toDate().toISOString(),
      });
      toast({ title: "Success", description: "Job application added." });
      setIsAddJobDialogOpen(false);
    } catch (error) {
      console.error("Error adding job:", error);
      toast({ title: "Error", description: "Could not add job application.", variant: "destructive" });
    }
  };

  const handleUpdateJob = async (id: string, updatedData: Partial<JobApplication>) => {
    if (!db || !userId || !appId) return;
    try {
      const jobDocPath = `artifacts/${appId}/users/${userId}/jobApplications/${id}`;
      await updateDoc(doc(db, jobDocPath), {
        ...updatedData,
        lastUpdated: Timestamp.now().toDate().toISOString(),
      });
      toast({ title: "Success", description: "Job application updated." });
    } catch (error) {
      console.error("Error updating job:", error);
      toast({ title: "Error", description: "Could not update job application.", variant: "destructive" });
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!db || !userId || !appId) return;
    try {
      const jobDocPath = `artifacts/${appId}/users/${userId}/jobApplications/${id}`;
      await deleteDoc(doc(db, jobDocPath));
      toast({ title: "Success", description: "Job application deleted." });
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({ title: "Error", description: "Could not delete job application.", variant: "destructive" });
    }
  };

  const filteredApplications = jobApplications.filter(job => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = job.title.toLowerCase().includes(searchTermLower) ||
                          job.company.toLowerCase().includes(searchTermLower);
    const matchesStatus = statusFilter ? job.status === statusFilter : true;
    const matchesPlatform = platformFilter ? job.platform === platformFilter : true;
    return matchesSearch && matchesStatus && matchesPlatform;
  });


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Job Application Dashboard</CardTitle>
          <Button onClick={() => setIsAddJobDialogOpen(true)} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Job
          </Button>
        </CardHeader>
        <CardContent>
          <CardDescription>Track and manage all your job applications in one place.</CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by title or company..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {JOB_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Platforms</SelectItem>
                  {JOB_PLATFORMS.map(platform => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </CardHeader>
        <CardContent>
          <JobApplicationTable
            applications={filteredApplications}
            loading={loading}
            onUpdate={handleUpdateJob}
            onDelete={handleDeleteJob}
          />
        </CardContent>
      </Card>

      <AddJobDialog
        isOpen={isAddJobDialogOpen}
        onClose={() => setIsAddJobDialogOpen(false)}
        onAddJob={handleAddJob}
      />
    </div>
  );
}
