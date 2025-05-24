
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ListFilter, Search } from 'lucide-react';
import { AddJobDialog } from '@/components/dashboard/AddJobDialog';
import { JobApplicationTable } from '@/components/dashboard/JobApplicationTable';
import type { JobApplication } from '@/lib/context/types';
import { useFirebase } from '@/lib/firebase/FirebaseProvider';
// Import Firestore functions:
// - collection: Creates a reference to a Firestore collection.
// - onSnapshot: Listens for real-time updates to a query.
// - query: Creates a Firestore query.
// - doc: Creates a reference to a Firestore document.
// - addDoc: Adds a new document to a collection.
// - updateDoc: Updates an existing document.
// - deleteDoc: Deletes a document.
// - Timestamp: Represents a Firestore timestamp, useful for date/time fields.
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JOB_STATUSES, JOB_PLATFORMS } from '@/constants';

export default function DashboardPage() {
  // State for controlling the "Add Job" dialog
  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false);
  // State to store job applications fetched from Firestore
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  // State to indicate if data is currently being loaded
  const [loading, setLoading] = useState(true);
  // Custom hook to get Firebase context (db, userId, appId)
  const { db, userId, appId } = useFirebase();
  // Custom hook for displaying toast notifications
  const { toast } = useToast();

  // State for search and filter inputs
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');

  // useEffect hook to fetch job applications from Firestore when the component mounts or Firebase context changes.
  useEffect(() => {
    // Ensure Firebase services (db, userId, appId) are available.
    if (!db || !userId || !appId) {
      setLoading(false);
      setJobApplications([]); // Clear applications if Firebase context is not ready
      return; // Exit if Firebase is not ready
    }

    setLoading(true); // Set loading state to true before fetching
    // Construct the Firestore collection path for job applications specific to the current user and app.
    const jobsColPath = `artifacts/${appId}/users/${userId}/jobApplications`;
    // Create a Firestore query to get all documents in the jobApplications collection.
    const q = query(collection(db, jobsColPath));

    // Subscribe to real-time updates from the Firestore query.
    // onSnapshot listens for changes and updates the component state accordingly.
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedJobs: JobApplication[] = [];
      // Iterate over each document in the snapshot.
      querySnapshot.forEach((doc) => {
        // Push the document data (spread with its ID) into the fetchedJobs array.
        fetchedJobs.push({ id: doc.id, ...doc.data() } as JobApplication);
      });
      // Sort applications in memory by lastUpdated date in descending order.
      fetchedJobs.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      setJobApplications(fetchedJobs); // Update component state with fetched jobs.
      setLoading(false); // Set loading state to false after data is fetched.
    }, (error) => {
      // Handle errors during data fetching.
      console.error("Error fetching job applications:", error);
      toast({ title: "Error", description: "Could not fetch job applications.", variant: "destructive" });
      setLoading(false); // Set loading state to false even if an error occurs.
    });

    // Cleanup function: Unsubscribe from onSnapshot listener when the component unmounts
    // or when dependencies (db, userId, appId, toast) change, to prevent memory leaks.
    return () => unsubscribe();
  }, [db, userId, appId, toast]); // Dependencies array for useEffect

  // Function to handle adding a new job application.
  const handleAddJob = async (jobData: Omit<JobApplication, 'id' | 'lastUpdated' | 'userId'>) => {
    if (!db || !userId || !appId) return; // Ensure Firebase is ready
    try {
      const jobsColPath = `artifacts/${appId}/users/${userId}/jobApplications`;
      // Add a new document to the Firestore collection.
      // Data includes jobData, userId, and ISO string formatted timestamps.
      await addDoc(collection(db, jobsColPath), {
        ...jobData,
        userId, // Associate the job with the current user.
        // Convert dateApplied to ISO string. Use current time if not provided.
        dateApplied: jobData.dateApplied ? Timestamp.fromDate(new Date(jobData.dateApplied)).toDate().toISOString() : Timestamp.now().toDate().toISOString(),
        lastUpdated: Timestamp.now().toDate().toISOString(), // Set lastUpdated to current time.
      });
      toast({ title: "Success", description: "Job application added." });
      setIsAddJobDialogOpen(false); // Close the dialog on success.
    } catch (error) {
      console.error("Error adding job:", error);
      toast({ title: "Error", description: "Could not add job application.", variant: "destructive" });
    }
  };

  // Function to handle updating an existing job application.
  const handleUpdateJob = async (id: string, updatedData: Partial<JobApplication>) => {
    if (!db || !userId || !appId) return; // Ensure Firebase is ready
    try {
      const jobDocPath = `artifacts/${appId}/users/${userId}/jobApplications/${id}`;
      // Update the Firestore document with new data.
      // Automatically updates the lastUpdated timestamp.
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

  // Function to handle deleting a job application.
  const handleDeleteJob = async (id: string) => {
    if (!db || !userId || !appId) return; // Ensure Firebase is ready
    try {
      const jobDocPath = `artifacts/${appId}/users/${userId}/jobApplications/${id}`;
      // Delete the Firestore document.
      await deleteDoc(doc(db, jobDocPath));
      toast({ title: "Success", description: "Job application deleted." });
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({ title: "Error", description: "Could not delete job application.", variant: "destructive" });
    }
  };

  // Filter applications based on search term, status, and platform.
  const filteredApplications = jobApplications.filter(job => {
    const searchTermLower = searchTerm.toLowerCase();
    // Check if job title or company includes the search term.
    const matchesSearch = job.title.toLowerCase().includes(searchTermLower) ||
                          job.company.toLowerCase().includes(searchTermLower);
    // Check if job status matches the filter (if a filter is set).
    const matchesStatus = statusFilter ? job.status === statusFilter : true;
    // Check if job platform matches the filter (if a filter is set).
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

      {/* Dialog for adding/editing job applications */}
      <AddJobDialog
        isOpen={isAddJobDialogOpen}
        onClose={() => setIsAddJobDialogOpen(false)}
        onAddJob={handleAddJob}
      />
    </div>
  );
}
