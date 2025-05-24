
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit2, Trash2, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { useResume } from '@/lib/context/ResumeProvider'; // Context for resume management
import type { Resume } from '@/lib/context/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns'; // For date formatting

export default function ResumesPage() {
  // Destructure functions and state from the ResumeProvider context.
  // This context handles Firestore interactions for resumes.
  const { 
    resumes,                // Array of all resumes.
    selectedResume,         // The currently selected resume object.
    setSelectedResumeId,    // Function to set the ID of the selected resume.
    addResume,              // Function to add a new resume to Firestore.
    updateResume,           // Function to update an existing resume in Firestore.
    deleteResume,           // Function to delete a resume from Firestore.
    loadingResumes,         // Boolean indicating if resumes are being loaded.
    summarizeResumeContent, // Function to call Genkit AI flow for resume summarization.
  } = useResume();
  
  // State for the resume being edited (if any).
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  // State for the form fields (resume name and content).
  const [resumeName, setResumeName] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  // State to indicate if a form submission (save/delete) is in progress.
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State to indicate if AI summarization is in progress.
  const [isSummarizing, setIsSummarizing] = useState(false);

  // useEffect to populate form fields when `editingResume` or `selectedResume` changes.
  useEffect(() => {
    if (editingResume) {
      // If a resume is being edited, set form fields to its data.
      setResumeName(editingResume.name);
      setResumeContent(editingResume.content);
    } else {
      // If not editing, but a resume is selected (view mode), display its content.
      if (selectedResume && !editingResume) {
        setResumeName(selectedResume.name);
        setResumeContent(selectedResume.content);
      } else {
        // If no resume is selected and not editing (i.e., preparing to add new), clear the form.
        clearForm();
      }
    }
  }, [editingResume, selectedResume]); // Dependencies: run when editingResume or selectedResume changes.
  
  // Function to clear the form fields and reset editing state.
  const clearForm = () => {
    setEditingResume(null); // No resume is being edited.
    setResumeName('');
    setResumeContent('');
  };

  // Handler for saving a resume (either new or an update to an existing one).
  const handleSaveResume = async () => {
    // Basic validation.
    if (!resumeName.trim() || !resumeContent.trim()) {
      alert("Resume name and content cannot be empty."); // TODO: Replace with a toast notification.
      return;
    }
    setIsSubmitting(true); // Indicate submission is in progress.
    if (editingResume) {
      // If editing an existing resume, call updateResume.
      await updateResume(editingResume.id, { name: resumeName, content: resumeContent });
    } else {
      // If adding a new resume, call addResume.
      const newResumeId = await addResume({ name: resumeName, content: resumeContent });
      if (newResumeId) setSelectedResumeId(newResumeId); // Auto-select the newly added resume.
    }
    setIsSubmitting(false); // Submission finished.
    clearForm(); // Clear form after saving.
  };

  // Handler to set a resume for editing.
  const handleEdit = (resume: Resume) => {
    setEditingResume(resume); // Set the resume to be edited.
    setSelectedResumeId(resume.id); // Also select it in the list.
  };

  // Handler for deleting a resume.
  const handleDelete = async (id: string) => {
    setIsSubmitting(true); // Indicate deletion is in progress.
    await deleteResume(id); // Call deleteResume from context.
    // If the deleted resume was the selected one, update selection.
    if (selectedResume?.id === id) {
       // Select the first available resume, or null if no resumes left.
       setSelectedResumeId(resumes.length > 0 && resumes[0].id !== id ? resumes[0].id : null);
    }
    // If the deleted resume was the one being edited, clear the form.
    if(editingResume?.id === id) {
      clearForm();
    }
    setIsSubmitting(false); // Deletion finished.
  };

  // Handler for AI summarization of the selected resume.
  const handleSummarize = async () => {
    if (!selectedResume) return; // Ensure a resume is selected.
    setIsSummarizing(true); // Indicate summarization is in progress.
    // Call summarizeResumeContent from context, which handles the AI call and updates Firestore.
    await summarizeResumeContent(selectedResume.id, selectedResume.content);
    setIsSummarizing(false); // Summarization finished.
  };

  // Main JSX for the Resumes page.
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Left Column: List of Resumes */}
      <div className="md:col-span-1 space-y-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Your Resumes</CardTitle>
            <CardDescription>Manage and select your resume versions.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Button to clear form and prepare for adding a new resume */}
            <Button onClick={() => clearForm()} className="w-full mb-4" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Resume
            </Button>
            {/* Display loading skeletons or resume list */}
            {loadingResumes ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
              </div>
            ) : resumes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No resumes yet. Add one!</p>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)]"> {/* Scrollable area for resume list */}
                <ul className="space-y-2">
                  {resumes.map((resume) => (
                    <li key={resume.id}>
                      <Card 
                        className={`p-3 cursor-pointer hover:shadow-md transition-all ${selectedResume?.id === resume.id ? 'ring-2 ring-primary bg-primary/10' : 'bg-card'}`}
                        onClick={() => {
                           setSelectedResumeId(resume.id); // Select resume on click.
                           if(!editingResume) { // If not in edit mode, load selected resume into view panel.
                             setResumeName(resume.name);
                             setResumeContent(resume.content);
                           }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{resume.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {/* Format lastUpdated date */}
                              Updated: {format(parseISO(resume.lastUpdated), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                             {/* Edit Button */}
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(resume);}}>
                                <Edit2 className="h-4 w-4" />
                             </Button>
                             {/* Delete Button with Confirmation Dialog */}
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
                        {/* Display badge if AI summary is available for the selected resume */}
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

      {/* Right Column: Resume Editor/Viewer */}
      <div className="md:col-span-2">
        <Card className="shadow-lg">
          <CardHeader>
            {/* Title changes based on whether editing, viewing, or adding new */}
            <CardTitle className="text-xl">{editingResume ? 'Edit Resume' : (selectedResume ? 'View Resume' : 'Add New Resume')}</CardTitle>
            <CardDescription>
              {editingResume ? 'Modify the details of this resume.' : (selectedResume && !editingResume ? `Viewing: ${selectedResume.name}` : 'Create a new resume version.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resume Name Input */}
            <div>
              <Label htmlFor="resumeName">Resume Name</Label>
              <Input 
                id="resumeName" 
                value={resumeName} 
                onChange={(e) => setResumeName(e.target.value)} 
                placeholder="e.g., Senior Developer Resume"
                // Disable if viewing selected resume and not in edit mode.
                disabled={!editingResume && !!selectedResume} 
              />
            </div>
            {/* Resume Content Textarea */}
            <div>
              <Label htmlFor="resumeContent">Resume Content</Label>
              <Textarea 
                id="resumeContent" 
                value={resumeContent} 
                onChange={(e) => setResumeContent(e.target.value)} 
                placeholder="Paste your resume content here..." 
                className="min-h-[300px] lg:min-h-[400px] xl:min-h-[500px]"
                // Disable if viewing selected resume and not in edit mode.
                disabled={!editingResume && !!selectedResume}
              />
            </div>

            {/* Display AI Summary if available and in view mode */}
            {selectedResume && !editingResume && selectedResume.summary && (
              <div className="mt-4 p-4 border rounded-md bg-muted/50">
                <h3 className="font-semibold text-sm mb-2">AI Generated Summary:</h3>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedResume.summary}</p>
              </div>
            )}

            {/* Action Buttons Area */}
            <div className="flex justify-between items-center">
              <div>
                {/* Show Save button if adding new or editing existing resume */}
                {(editingResume || (!editingResume && !selectedResume)) && (
                  <Button onClick={handleSaveResume} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    {editingResume ? 'Save Changes' : 'Save New Resume'}
                  </Button>
                )}
                {/* Show Cancel Edit button if in edit mode */}
                {editingResume && (
                  <Button variant="outline" onClick={clearForm} className="ml-2">Cancel Edit</Button>
                )}
              </div>
              {/* Show Edit and Summarize buttons if viewing a selected resume (not editing) */}
              {selectedResume && !editingResume && (
                <div className="flex gap-2">
                    {/* Button to switch to edit mode for the selected resume */}
                    <Button variant="outline" onClick={() => handleEdit(selectedResume)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit This Resume
                    </Button>
                    {/* Button to trigger AI summarization */}
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
