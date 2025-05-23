"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase/FirebaseProvider';
import type { JobApplication, EmailLog, InterviewNote, CompanyResearch, EmailType } from '@/lib/context/types';
import { doc, getDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Edit2, Trash2, PlusCircle, Mail, Users, Building, Calendar as CalendarIconLucide, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AddJobDialog } from '@/components/dashboard/AddJobDialog'; // For editing main job details
import { EMAIL_TYPES } from '@/constants';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Helper to safely get string from Firestore Timestamp or existing string
const getDateString = (dateValue: string | Timestamp | undefined | null): string => {
  if (!dateValue) return '';
  if (typeof dateValue === 'string') return dateValue;
  if (dateValue instanceof Timestamp) return dateValue.toDate().toISOString();
  return '';
};


export default function JobDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;
  const { db, userId, appId } = useFirebase();
  const { toast } = useToast();

  const [job, setJob] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingJob, setIsEditingJob] = useState(false);

  // States for sub-collections
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [interviewNotes, setInterviewNotes] = useState<InterviewNote[]>([]);
  const [companyResearch, setCompanyResearch] = useState<CompanyResearch | null>(null); // Assuming one research doc per company for now

  // States for forms within tabs
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<Partial<EmailLog>>({ type: EMAIL_TYPES[0], dateSent: new Date().toISOString() });
  const [emailDate, setEmailDate] = useState<Date | undefined>(new Date());

  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [currentInterview, setCurrentInterview] = useState<Partial<InterviewNote>>({ date: new Date().toISOString() });
  const [interviewDate, setInterviewDate] = useState<Date | undefined>(new Date());
  
  const [isSaving, setIsSaving] = useState(false);


  // Fetch Job Application Details
  useEffect(() => {
    if (!db || !userId || !appId || !jobId) return;
    setLoading(true);
    const jobDocPath = `artifacts/${appId}/users/${userId}/jobApplications/${jobId}`;
    const unsubscribe = onSnapshot(doc(db, jobDocPath), (docSnap) => {
      if (docSnap.exists()) {
        setJob({ id: docSnap.id, ...docSnap.data() } as JobApplication);
      } else {
        toast({ title: "Error", description: "Job application not found.", variant: "destructive" });
        router.push('/dashboard'); // Redirect if job not found
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching job details:", error);
      toast({ title: "Error", description: "Could not fetch job details.", variant: "destructive" });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db, userId, appId, jobId, router, toast]);

  // Fetch Email Logs
  useEffect(() => {
    if (!db || !userId || !appId || !jobId) return;
    const emailsColPath = `artifacts/${appId}/users/${userId}/emailLogs`;
    const q = query(collection(db, emailsColPath), where("jobId", "==", jobId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailLog))
        .sort((a,b) => new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime());
      setEmailLogs(logs);
    });
    return () => unsubscribe();
  }, [db, userId, appId, jobId]);

  // Fetch Interview Notes
  useEffect(() => {
    if (!db || !userId || !appId || !jobId) return;
    const interviewsColPath = `artifacts/${appId}/users/${userId}/interviewNotes`;
    const q = query(collection(db, interviewsColPath), where("jobId", "==", jobId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InterviewNote))
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setInterviewNotes(notes);
    });
    return () => unsubscribe();
  }, [db, userId, appId, jobId]);
  
  // Fetch Company Research (simplified: by company name, assumes one entry)
  useEffect(() => {
    if (!db || !userId || !appId || !job?.company) return;
    const researchColPath = `artifacts/${appId}/users/${userId}/companyResearch`;
    // This query might return multiple if not careful, for now assumes companyName is unique enough as an ID or main field
    // A better approach would be to have a companyId or a dedicated way to link.
    // For simplicity, we'll try to fetch one document that matches the company name.
    // This is a simplification; a real app might need a more robust way to manage companies.
    const q = query(collection(db, researchColPath), where("companyName", "==", job.company));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const researchDoc = snapshot.docs[0];
        setCompanyResearch({ id: researchDoc.id, ...researchDoc.data() } as CompanyResearch);
      } else {
        setCompanyResearch(null);
      }
    });
    return () => unsubscribe();
  }, [db, userId, appId, job?.company]);


  const handleUpdateJob = async (updatedData: Omit<JobApplication, 'id' | 'lastUpdated' | 'userId'>) => {
    if (!db || !userId || !appId || !jobId) return;
    setIsSaving(true);
    try {
      const jobDocPath = `artifacts/${appId}/users/${userId}/jobApplications/${jobId}`;
      await updateDoc(doc(db, jobDocPath), {
        ...updatedData,
        lastUpdated: Timestamp.now().toDate().toISOString(),
      });
      toast({ title: "Success", description: "Job application updated." });
      setIsEditingJob(false);
    } catch (error) {
      console.error("Error updating job:", error);
      toast({ title: "Error", description: "Could not update job application.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveEmailLog = async () => {
    if (!db || !userId || !appId || !jobId || !currentEmail.type) return;
    setIsSaving(true);
    const dataToSave = {
        ...currentEmail,
        jobId,
        userId,
        dateSent: emailDate ? emailDate.toISOString() : new Date().toISOString(),
    };
    const colPath = `artifacts/${appId}/users/${userId}/emailLogs`;
    try {
        if (currentEmail.id) { // Update existing
            await updateDoc(doc(db, colPath, currentEmail.id), dataToSave);
            toast({ title: "Success", description: "Email log updated." });
        } else { // Add new
            await addDoc(collection(db, colPath), dataToSave);
            toast({ title: "Success", description: "Email log added." });
        }
        setCurrentEmail({ type: EMAIL_TYPES[0], dateSent: new Date().toISOString() });
        setEmailDate(new Date());
        setShowEmailForm(false);
    } catch (error) {
        console.error("Error saving email log:", error);
        toast({ title: "Error", description: "Could not save email log.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteEmailLog = async (emailId: string) => {
    if (!db || !userId || !appId) return;
    try {
        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/emailLogs`, emailId));
        toast({title: "Deleted", description: "Email log removed."});
    } catch (error) {
        toast({title: "Error", description: "Failed to delete email log.", variant: "destructive"});
    }
  };

  const handleSaveInterviewNote = async () => {
    if (!db || !userId || !appId || !jobId || !currentInterview.date) return;
    setIsSaving(true);
    const dataToSave = {
        ...currentInterview,
        jobId,
        userId,
        date: interviewDate ? interviewDate.toISOString() : new Date().toISOString(),
        interviewers: typeof currentInterview.interviewers === 'string' ? (currentInterview.interviewers as string).split(',').map(s => s.trim()).filter(Boolean) : currentInterview.interviewers || [],
    };
    const colPath = `artifacts/${appId}/users/${userId}/interviewNotes`;
    try {
        if (currentInterview.id) { // Update existing
            await updateDoc(doc(db, colPath, currentInterview.id), dataToSave);
            toast({ title: "Success", description: "Interview note updated." });
        } else { // Add new
            await addDoc(collection(db, colPath), dataToSave);
            toast({ title: "Success", description: "Interview note added." });
        }
        setCurrentInterview({ date: new Date().toISOString() });
        setInterviewDate(new Date());
        setShowInterviewForm(false);
    } catch (error) {
        console.error("Error saving interview note:", error);
        toast({ title: "Error", description: "Could not save interview note.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteInterviewNote = async (noteId: string) => {
    if (!db || !userId || !appId) return;
    try {
        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/interviewNotes`, noteId));
        toast({title: "Deleted", description: "Interview note removed."});
    } catch (error) {
        toast({title: "Error", description: "Failed to delete interview note.", variant: "destructive"});
    }
  };
  
  const handleSaveCompanyResearch = async (data: Partial<CompanyResearch>) => {
    if (!db || !userId || !appId || !job?.company) return;
    setIsSaving(true);
    const researchColPath = `artifacts/${appId}/users/${userId}/companyResearch`;
    const researchData = {
      ...companyResearch, // existing data
      ...data, // new data
      companyName: job.company,
      userId,
      // Ensure linkedJobIds is an array and add current jobId if not present
      linkedJobIds: Array.from(new Set([...(companyResearch?.linkedJobIds || []), jobId])), 
    };

    try {
      if (companyResearch?.id) { // Update existing
        await updateDoc(doc(db, researchColPath, companyResearch.id), researchData);
        toast({ title: "Success", description: "Company research updated." });
      } else { // Add new
        const newDocRef = await addDoc(collection(db, researchColPath), researchData);
        // Update local state with new ID
        setCompanyResearch({ ...researchData, id: newDocRef.id });
        toast({ title: "Success", description: "Company research saved." });
      }
    } catch (error) {
      console.error("Error saving company research:", error);
      toast({ title: "Error", description: "Could not save company research.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };


  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!job) {
    return <div className="text-center py-10">Job application not found.</div>;
  }
  
  const renderEmailForm = () => (
    <Dialog open={showEmailForm} onOpenChange={(open) => {
        setShowEmailForm(open);
        if (!open) {
            setCurrentEmail({ type: EMAIL_TYPES[0], dateSent: new Date().toISOString() });
            setEmailDate(new Date());
        }
    }}>
      <DialogTrigger asChild>
        <Button size="sm" onClick={() => {
             setCurrentEmail({ type: EMAIL_TYPES[0], dateSent: new Date().toISOString() });
             setEmailDate(new Date());
             setShowEmailForm(true);
        }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Log Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{currentEmail.id ? "Edit Email Log" : "Log New Email"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="emailType" className="text-right">Type</Label>
            <Select 
              value={currentEmail.type} 
              onValueChange={(value: EmailType) => setCurrentEmail(prev => ({...prev, type: value}))}
            >
              <SelectTrigger className="col-span-3"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{EMAIL_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="emailDateSent" className="text-right">Date Sent</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("col-span-3 justify-start text-left font-normal", !emailDate && "text-muted-foreground")}>
                  <CalendarIconLucide className="mr-2 h-4 w-4" />
                  {emailDate ? format(emailDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={emailDate} onSelect={setEmailDate} initialFocus /></PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="emailRecipient" className="text-right">Recipient</Label>
            <Input id="emailRecipient" value={currentEmail.recipient || ''} onChange={e => setCurrentEmail(prev => ({...prev, recipient: e.target.value}))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="emailSubject" className="text-right">Subject</Label>
            <Input id="emailSubject" value={currentEmail.subject || ''} onChange={e => setCurrentEmail(prev => ({...prev, subject: e.target.value}))} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="emailBody" className="text-right pt-2">Body</Label>
            <Textarea id="emailBody" value={currentEmail.body || ''} onChange={e => setCurrentEmail(prev => ({...prev, body: e.target.value}))} className="col-span-3 min-h-[100px]" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="emailNotes" className="text-right pt-2">Notes</Label>
            <Textarea id="emailNotes" value={currentEmail.notes || ''} onChange={e => setCurrentEmail(prev => ({...prev, notes: e.target.value}))} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowEmailForm(false)}>Cancel</Button>
          <Button onClick={handleSaveEmailLog} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{currentEmail.id ? "Update Log" : "Add Log"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderInterviewForm = () => (
     <Dialog open={showInterviewForm} onOpenChange={(open) => {
        setShowInterviewForm(open);
        if (!open) {
             setCurrentInterview({ date: new Date().toISOString() });
             setInterviewDate(new Date());
        }
    }}>
      <DialogTrigger asChild>
         <Button size="sm" onClick={() => {
             setCurrentInterview({ date: new Date().toISOString() });
             setInterviewDate(new Date());
             setShowInterviewForm(true);
        }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Interview Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{currentInterview.id ? "Edit Interview Note" : "Add New Interview Note"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="interviewDate" className="text-right">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("col-span-3 justify-start text-left font-normal", !interviewDate && "text-muted-foreground")}>
                      <CalendarIconLucide className="mr-2 h-4 w-4" />
                      {interviewDate ? format(interviewDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={interviewDate} onSelect={setInterviewDate} initialFocus /></PopoverContent>
                </Popover>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="interviewers" className="text-right">Interviewers</Label>
                <Input 
                    id="interviewers" 
                    value={Array.isArray(currentInterview.interviewers) ? currentInterview.interviewers.join(', ') : currentInterview.interviewers || ''} 
                    onChange={e => setCurrentInterview(prev => ({...prev, interviewers: e.target.value.split(',').map(s=>s.trim())}))} 
                    className="col-span-3" 
                    placeholder="John Doe, Jane Smith"
                />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="questionsAsked" className="text-right pt-2">Questions Asked</Label>
                <Textarea id="questionsAsked" value={currentInterview.questionsAsked || ''} onChange={e => setCurrentInterview(prev => ({...prev, questionsAsked: e.target.value}))} className="col-span-3 min-h-[100px]" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="yourResponses" className="text-right pt-2">Your Responses</Label>
                <Textarea id="yourResponses" value={currentInterview.yourResponses || ''} onChange={e => setCurrentInterview(prev => ({...prev, yourResponses: e.target.value}))} className="col-span-3 min-h-[100px]" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="selfAssessment" className="text-right pt-2">Self Assessment</Label>
                <Textarea id="selfAssessment" value={currentInterview.selfAssessment || ''} onChange={e => setCurrentInterview(prev => ({...prev, selfAssessment: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="interviewNotes" className="text-right pt-2">General Notes</Label>
                <Textarea id="interviewNotes" value={currentInterview.notes || ''} onChange={e => setCurrentInterview(prev => ({...prev, notes: e.target.value}))} className="col-span-3" />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowInterviewForm(false)}>Cancel</Button>
          <Button onClick={handleSaveInterviewNote} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{currentInterview.id ? "Update Note" : "Add Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2 md:mb-0">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditingJob(true)}>
              <Edit2 className="mr-2 h-4 w-4" /> Edit Job Details
            </Button>
          </div>
          <CardTitle className="text-3xl font-bold mt-2">{job.title}</CardTitle>
          <CardDescription className="text-lg">{job.company}</CardDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{job.platform}</Badge>
            <Badge className={job.status === 'Offer Received' ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'}>{job.status}</Badge>
            {job.dateApplied && <Badge variant="outline">Applied: {format(parseISO(job.dateApplied), 'MMM d, yyyy')}</Badge>}
          </div>
           {job.link && <a href={job.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-2 inline-block">View Job Post</a>}
        </CardHeader>
        {job.jobDescription && (
          <CardContent>
              <h3 className="font-semibold mb-1">Job Description:</h3>
              <ScrollArea className="h-32 p-2 border rounded bg-muted/30">
                <p className="text-xs whitespace-pre-wrap">{job.jobDescription}</p>
              </ScrollArea>
          </CardContent>
        )}
        {job.notes && (
            <CardFooter>
                <div>
                    <h3 className="font-semibold mb-1">Notes:</h3>
                    <p className="text-sm whitespace-pre-wrap p-2 border rounded bg-muted/30">{job.notes}</p>
                </div>
            </CardFooter>
        )}
      </Card>

      <Tabs defaultValue="emails" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="emails"><Mail className="mr-2 h-4 w-4 inline-block"/>Emails</TabsTrigger>
          <TabsTrigger value="interviews"><Users className="mr-2 h-4 w-4 inline-block"/>Interviews</TabsTrigger>
          <TabsTrigger value="company"><Building className="mr-2 h-4 w-4 inline-block"/>Company</TabsTrigger>
        </TabsList>

        <TabsContent value="emails">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Email Logs</CardTitle>
              {renderEmailForm()}
            </CardHeader>
            <CardContent>
              {emailLogs.length === 0 ? <p className="text-muted-foreground">No emails logged for this application yet.</p> : (
                <div className="space-y-4">
                  {emailLogs.map(log => (
                    <Card key={log.id} className="p-4">
                       <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{log.subject || log.type}</p>
                                <p className="text-sm text-muted-foreground">To: {log.recipient || 'N/A'} on {format(parseISO(getDateString(log.dateSent)), 'MMM d, yyyy')}</p>
                                <Badge variant="outline" className="mt-1">{log.type}</Badge>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setCurrentEmail(log); setEmailDate(new Date(getDateString(log.dateSent))); setShowEmailForm(true);}}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Delete Email Log?</AlertDialogTitle><AlertDialogDescription>Are you sure to delete this email log: "{log.subject || log.type}"?</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteEmailLog(log.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                      {log.body && <p className="text-xs mt-2 whitespace-pre-wrap p-2 border rounded bg-muted/20 max-h-24 overflow-y-auto">{log.body}</p>}
                      {log.notes && <p className="text-xs mt-1 text-muted-foreground italic">Notes: {log.notes}</p>}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Interview Notes</CardTitle>
              {renderInterviewForm()}
            </CardHeader>
            <CardContent>
              {interviewNotes.length === 0 ? <p className="text-muted-foreground">No interview notes recorded yet.</p> : (
                <div className="space-y-4">
                  {interviewNotes.map(note => (
                    <Card key={note.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold">Interview on {format(parseISO(getDateString(note.date)), 'MMM d, yyyy')}</p>
                            {note.interviewers && note.interviewers.length > 0 && <p className="text-sm text-muted-foreground">With: {note.interviewers.join(', ')}</p>}
                        </div>
                         <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setCurrentInterview({...note, interviewers: note.interviewers || []}); setInterviewDate(new Date(getDateString(note.date))); setShowInterviewForm(true);}}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete Interview Note?</AlertDialogTitle><AlertDialogDescription>Are you sure to delete this note from {format(parseISO(getDateString(note.date)), 'MMM d, yyyy')}?</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteInterviewNote(note.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </div>
                      {note.questionsAsked && <div className="mt-2"><p className="text-xs font-medium">Questions:</p><p className="text-xs whitespace-pre-wrap p-1 border rounded bg-muted/20 max-h-20 overflow-y-auto">{note.questionsAsked}</p></div>}
                      {note.yourResponses && <div className="mt-1"><p className="text-xs font-medium">Responses:</p><p className="text-xs whitespace-pre-wrap p-1 border rounded bg-muted/20 max-h-20 overflow-y-auto">{note.yourResponses}</p></div>}
                      {note.selfAssessment && <div className="mt-1"><p className="text-xs font-medium">Assessment:</p><p className="text-xs whitespace-pre-wrap p-1 border rounded bg-muted/20">{note.selfAssessment}</p></div>}
                      {note.notes && <p className="text-xs mt-1 text-muted-foreground italic">Notes: {note.notes}</p>}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Research: {job.company}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {/* This is a simplified form. A real app might use a more structured component for each field. */}
                <div><Label>Industry</Label><Input defaultValue={companyResearch?.industry} onBlur={(e) => handleSaveCompanyResearch({ industry: e.target.value })} placeholder="e.g., Technology, Finance" /></div>
                <div><Label>Mission</Label><Textarea defaultValue={companyResearch?.mission} onBlur={(e) => handleSaveCompanyResearch({ mission: e.target.value })} placeholder="Company's mission statement..." /></div>
                <div><Label>Values</Label><Textarea defaultValue={companyResearch?.values} onBlur={(e) => handleSaveCompanyResearch({ values: e.target.value })} placeholder="Core company values..." /></div>
                <div><Label>Recent News/Highlights</Label><Textarea defaultValue={companyResearch?.recentNewsHighlights} onBlur={(e) => handleSaveCompanyResearch({ recentNewsHighlights: e.target.value })} placeholder="Key news, product launches, etc." /></div>
                <div><Label>Culture Notes</Label><Textarea defaultValue={companyResearch?.cultureNotes} onBlur={(e) => handleSaveCompanyResearch({ cultureNotes: e.target.value })} placeholder="Notes on company culture, work environment..." /></div>
                 {/* Key Contacts could be a sub-component list allowing adding/editing contacts */}
                 {isSaving && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving research...</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isEditingJob && job && (
        <AddJobDialog
          isOpen={isEditingJob}
          onClose={() => setIsEditingJob(false)}
          onAddJob={handleUpdateJob} // Re-using for update
          initialData={job}
        />
      )}
    </div>
  );
}
