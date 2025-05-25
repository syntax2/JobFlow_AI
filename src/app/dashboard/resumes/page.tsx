
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit2, Trash2, CheckCircle, Loader2, Sparkles, FilePlus2, Eye } from 'lucide-react';
import { useResume } from '@/lib/context/ResumeProvider'; // Context for resume management
import type { Resume } from '@/lib/context/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns'; // For date formatting
import { useRouter } from 'next/navigation';


export default function ResumesPage() {
  const router = useRouter();
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
      if (selectedResume && !editingResume && !selectedResume.templateId) { // Only show plain text content if not a builder resume
        setResumeName(selectedResume.name);
        setResumeContent(selectedResume.content);
      } else if (selectedResume && selectedResume.templateId) { // For builder resumes in view mode
        setResumeName(selectedResume.name);
        setResumeContent(''); // Clear text area for builder resumes, they are viewed/edited in builder
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
    if (!resumeName.trim() || (!editingResume && !resumeContent.trim() && !selectedResume?.structuredData)) { // Ensure content if new text resume
      alert("Resume name and content cannot be empty for plain text resumes.");
      return;
    }
    setIsSubmitting(true);
    if (editingResume) {
      await updateResume(editingResume.id, { name: resumeName, content: resumeContent });
    } else {
      // Adding new plain text resume
      const newResumeId = await addResume({ name: resumeName, content: resumeContent });
      if (newResumeId) setSelectedResumeId(newResumeId);
    }
    setIsSubmitting(false);
    clearForm();
  };

  const handleEdit = (resume: Resume) => {
    if (resume.templateId && resume.structuredData) {
      // If it's a builder resume, navigate to the builder page for editing
      router.push(`/dashboard/resumes/builder?id=${resume.id}`);
    } else {
      // If it's a plain text resume, edit inline
      setEditingResume(resume);
      setSelectedResumeId(resume.id);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    await deleteResume(id);
    if (selectedResume?.id === id) {
       const nonBuilderResumes = resumes.filter(r => !r.templateId);
       setSelectedResumeId(nonBuilderResumes.length > 0 && nonBuilderResumes[0].id !== id ? nonBuilderResumes[0].id : (resumes.length > 0 && resumes[0].id !== id ? resumes[0].id : null));
    }
    if(editingResume?.id === id) {
      clearForm();
    }
    setIsSubmitting(false);
  };

  const handleSummarize = async () => {
    if (!selectedResume || selectedResume.templateId) { // Only summarize plain text resumes
        alert("AI summarization is available for plain text resumes. For builder resumes, the summary section is part of the form.");
        return;
    }
    if (!selectedResume.content.trim()){
        alert("Resume content is empty. Cannot summarize.");
        return;
    }
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
             <Link href="/dashboard/resumes/builder" passHref>
              <Button className="w-full mb-2" variant="default">
                <FilePlus2 className="mr-2 h-4 w-4" /> Create with Builder
              </Button>
            </Link>
            <Button onClick={() => { clearForm(); setSelectedResumeId(null); }} className="w-full mb-4" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Plain Text Resume
            </Button>
            {loadingResumes ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
              </div>
            ) : resumes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No resumes yet. Add one!</p>
            ) : (
              <ScrollArea className="h-[calc(100vh-350px)]"> 
                <ul className="space-y-2">
                  {resumes.map((resume) => (
                    <li key={resume.id}>
                      <Card 
                        className={`p-3 cursor-pointer hover:shadow-md transition-all ${selectedResume?.id === resume.id ? 'ring-2 ring-primary bg-primary/10' : 'bg-card'}`}
                        onClick={() => {
                           setSelectedResumeId(resume.id);
                           if(!editingResume) { 
                             if (resume.templateId) { // For builder resumes
                                setResumeName(resume.name);
                                setResumeContent(''); // Don't show JSON in text area
                             } else { // For plain text resumes
                                setResumeName(resume.name);
                                setResumeContent(resume.content);
                             }
                           }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{resume.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Updated: {format(parseISO(resume.lastUpdated), 'MMM d, h:mm a')}
                            </p>
                            {resume.templateId && <Badge variant="secondary" className="mt-1 text-xs">Builder Resume</Badge>}
                          </div>
                          <div className="flex items-center gap-1">
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(resume);}}>
                                {resume.templateId ? <Eye className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
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
                        {selectedResume?.id === resume.id && resume.summary && !resume.templateId && (
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
            <CardTitle className="text-xl">
              {editingResume ? `Edit Plain Text: ${editingResume.name}` : 
               (selectedResume && !selectedResume.templateId ? `View Plain Text: ${selectedResume.name}` : 
               (selectedResume && selectedResume.templateId ? `Builder Resume: ${selectedResume.name}` : 'Add New Plain Text Resume'))}
            </CardTitle>
            <CardDescription>
              {editingResume ? 'Modify the plain text content of this resume.' : 
               (selectedResume && !selectedResume.templateId ? 'Viewing plain text resume.' : 
               (selectedResume && selectedResume.templateId ? 'This resume is built with the Resume Builder. Click Edit/View to open in builder.' : 
               'Create a new plain text resume by pasting content below.'))}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(editingResume || (!selectedResume || !selectedResume.templateId)) && ( // Show form if editing or adding new plain text, or if selected is plain text
            <>
              <div>
                <Label htmlFor="resumeName">Resume Name</Label>
                <Input 
                  id="resumeName" 
                  value={resumeName} 
                  onChange={(e) => setResumeName(e.target.value)} 
                  placeholder="e.g., Senior Developer Resume (Plain Text)"
                  disabled={!editingResume && !!selectedResume && !selectedResume.templateId && !editingResume} 
                />
              </div>
              <div>
                <Label htmlFor="resumeContent">Resume Content (Plain Text)</Label>
                <Textarea 
                  id="resumeContent" 
                  value={resumeContent} 
                  onChange={(e) => setResumeContent(e.target.value)} 
                  placeholder="Paste your resume content here..." 
                  className="min-h-[300px] lg:min-h-[400px] xl:min-h-[500px]"
                  disabled={!editingResume && !!selectedResume && !selectedResume.templateId && !editingResume}
                />
              </div>
            </>
            )}
            {selectedResume && selectedResume.templateId && (
                <div className="text-center p-8 border-2 border-dashed rounded-md">
                    <FilePlus2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">This is a Builder Resume</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        "{selectedResume.name}" was created using the Resume Builder.
                        To view or edit its content, please use the builder.
                    </p>
                    <Button onClick={() => router.push(`/dashboard/resumes/builder?id=${selectedResume.id}`)}>
                        <Eye className="mr-2 h-4 w-4" /> Open in Builder
                    </Button>
                </div>
            )}


            {selectedResume && !editingResume && !selectedResume.templateId && selectedResume.summary && (
              <div className="mt-4 p-4 border rounded-md bg-muted/50">
                <h3 className="font-semibold text-sm mb-2">AI Generated Summary:</h3>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedResume.summary}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div>
                {(editingResume || (!editingResume && !selectedResume)) && ! (selectedResume && selectedResume.templateId) && ( // Save for plain text
                  <Button onClick={handleSaveResume} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    {editingResume ? 'Save Changes' : 'Save New Plain Text Resume'}
                  </Button>
                )}
                {editingResume && (
                  <Button variant="outline" onClick={clearForm} className="ml-2">Cancel Edit</Button>
                )}
              </div>
              {selectedResume && !editingResume && !selectedResume.templateId && ( // Actions for selected plain text resume
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleEdit(selectedResume)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit Plain Text
                    </Button>
                    <Button onClick={handleSummarize} disabled={isSummarizing || !selectedResume.content.trim()}>
                        {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {selectedResume.summary ? 'Re-Summarize (AI)' : 'AI Summarize'}
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
