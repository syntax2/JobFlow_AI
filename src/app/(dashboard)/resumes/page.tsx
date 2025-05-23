"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit2, Trash2, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { useResume } from '@/lib/context/ResumeProvider';
import type { Resume } from '@/lib/context/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

export default function ResumesPage() {
  const { 
    resumes, 
    selectedResume, 
    setSelectedResumeId, 
    addResume, 
    updateResume, 
    deleteResume, 
    loadingResumes,
    summarizeResumeContent,
  } = useResume();
  
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [resumeName, setResumeName] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    if (editingResume) {
      setResumeName(editingResume.name);
      setResumeContent(editingResume.content);
    } else {
      // If no resume is being edited, but there's a selected one, show its content (read-only)
      // Or clear if nothing selected. This page primarily for editing/adding.
      if (selectedResume && !editingResume) {
        setResumeName(selectedResume.name);
        setResumeContent(selectedResume.content);
      } else {
        clearForm();
      }
    }
  }, [editingResume, selectedResume]);
  
  const clearForm = () => {
    setEditingResume(null);
    setResumeName('');
    setResumeContent('');
  };

  const handleSaveResume = async () => {
    if (!resumeName.trim() || !resumeContent.trim()) {
      alert("Resume name and content cannot be empty."); // Replace with toast
      return;
    }
    setIsSubmitting(true);
    if (editingResume) {
      await updateResume(editingResume.id, { name: resumeName, content: resumeContent });
    } else {
      const newResumeId = await addResume({ name: resumeName, content: resumeContent });
      if (newResumeId) setSelectedResumeId(newResumeId); // Auto-select new resume
    }
    setIsSubmitting(false);
    clearForm();
  };

  const handleEdit = (resume: Resume) => {
    setEditingResume(resume);
    setSelectedResumeId(resume.id); // Also select it when editing
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    await deleteResume(id);
    if (selectedResume?.id === id) {
       setSelectedResumeId(resumes.length > 0 && resumes[0].id !== id ? resumes[0].id : null);
    }
    if(editingResume?.id === id) {
      clearForm();
    }
    setIsSubmitting(false);
  };

  const handleSummarize = async () => {
    if (!selectedResume) return;
    setIsSummarizing(true);
    await summarizeResumeContent(selectedResume.id, selectedResume.content);
    setIsSummarizing(false);
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Your Resumes</CardTitle>
            <CardDescription>Manage and select your resume versions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => clearForm()} className="w-full mb-4" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Resume
            </Button>
            {loadingResumes ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
              </div>
            ) : resumes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No resumes yet. Add one!</p>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)]"> {/* Adjust height as needed */}
                <ul className="space-y-2">
                  {resumes.map((resume) => (
                    <li key={resume.id}>
                      <Card 
                        className={`p-3 cursor-pointer hover:shadow-md transition-all ${selectedResume?.id === resume.id ? 'ring-2 ring-primary bg-primary/10' : 'bg-card'}`}
                        onClick={() => {
                           setSelectedResumeId(resume.id);
                           if(!editingResume) { // if not in edit mode, load selected resume into view
                             setResumeName(resume.name);
                             setResumeContent(resume.content);
                           }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{resume.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Updated: {format(parseISO(resume.lastUpdated), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(resume);}}>
                                <Edit2 className="h-4 w-4" />
                             </Button>
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive-foreground hover:bg-destructive" onClick={(e) => e.stopPropagation()}>
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     Are you sure you want to delete "{resume.name}"? This action cannot be undone.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => handleDelete(resume.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                          </div>
                        </div>
                        {selectedResume?.id === resume.id && resume.summary && (
                          <Badge variant="outline" className="mt-2 text-xs">AI Summary Available</Badge>
                        )}
                      </Card>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">{editingResume ? 'Edit Resume' : (selectedResume ? 'View Resume' : 'Add New Resume')}</CardTitle>
            <CardDescription>
              {editingResume ? 'Modify the details of this resume.' : (selectedResume && !editingResume ? `Viewing: ${selectedResume.name}` : 'Create a new resume version.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="resumeName">Resume Name</Label>
              <Input 
                id="resumeName" 
                value={resumeName} 
                onChange={(e) => setResumeName(e.target.value)} 
                placeholder="e.g., Senior Developer Resume"
                disabled={!editingResume && !!selectedResume} // Disabled if viewing selected, not editing
              />
            </div>
            <div>
              <Label htmlFor="resumeContent">Resume Content</Label>
              <Textarea 
                id="resumeContent" 
                value={resumeContent} 
                onChange={(e) => setResumeContent(e.target.value)} 
                placeholder="Paste your resume content here..." 
                className="min-h-[300px] lg:min-h-[400px] xl:min-h-[500px]"
                disabled={!editingResume && !!selectedResume} // Disabled if viewing selected, not editing
              />
            </div>

            {selectedResume && !editingResume && selectedResume.summary && (
              <div className="mt-4 p-4 border rounded-md bg-muted/50">
                <h3 className="font-semibold text-sm mb-2">AI Generated Summary:</h3>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedResume.summary}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div>
                {(editingResume || (!editingResume && !selectedResume)) && ( // Show save if adding new or editing
                  <Button onClick={handleSaveResume} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    {editingResume ? 'Save Changes' : 'Save New Resume'}
                  </Button>
                )}
                {editingResume && (
                  <Button variant="outline" onClick={clearForm} className="ml-2">Cancel Edit</Button>
                )}
              </div>
              {selectedResume && !editingResume && ( // Show Edit and Summarize if viewing selected
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleEdit(selectedResume)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit This Resume
                    </Button>
                    <Button onClick={handleSummarize} disabled={isSummarizing || !selectedResume.content}>
                        {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {selectedResume.summary ? 'Re-Summarize' : 'AI Summarize'}
                    </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
