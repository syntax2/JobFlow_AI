
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResumeForm } from '@/components/resume-builder/ResumeForm';
import { ResumePreview } from '@/components/resume-builder/ResumePreview';
import type { Resume, ResumeData, ResumeTemplateId } from '@/lib/context/types';
import { useResume } from '@/lib/context/ResumeProvider';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for sections

const initialResumeData: ResumeData = {
  personalInfo: { fullName: '', jobTitle: '', email: '', phone: '', linkedin: '', portfolio: '', address: '' },
  summary: '',
  experience: [{ id: uuidv4(), jobTitle: '', company: '', location: '', startDate: '', endDate: '', description: '' }],
  education: [{ id: uuidv4(), degree: '', institution: '', location: '', graduationYear: '', description: '' }],
  skills: [{ id: uuidv4(), name: '' }],
  customSections: [],
};

const templates: { id: ResumeTemplateId; name: string; description: string; image?: string }[] = [
  { id: 'modern', name: 'Modern', description: 'A sleek, two-column design.', image: 'https://placehold.co/300x400.png?text=Modern+Template' },
  { id: 'classic', name: 'Classic', description: 'A traditional single-column layout.', image: 'https://placehold.co/300x400.png?text=Classic+Template' },
  { id: 'ivy-league', name: 'Ivy League', description: 'A formal, academic-focused style.', image: 'https://placehold.co/300x400.png?text=Ivy+League' },
];

export default function ResumeBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addResume, updateResume, getResumeById, loadingResumes } = useResume();
  const { toast } = useToast();

  const [resumeName, setResumeName] = useState('Untitled Resume');
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateId>(templates[0].id);
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [isSaving, setIsSaving] = useState(false);
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  useEffect(() => {
    const resumeId = searchParams.get('id');
    if (resumeId) {
      setIsLoadingExisting(true);
      setEditingResumeId(resumeId);
      // Fetch and load existing resume data
      // This might take a moment if resumes are not yet loaded in context
      const loadExisting = () => {
        const existingResume = getResumeById(resumeId);
        if (existingResume) {
          setResumeName(existingResume.name);
          setSelectedTemplate(existingResume.templateId || templates[0].id);
          setResumeData(existingResume.structuredData || initialResumeData);
          setIsLoadingExisting(false);
        } else if (!loadingResumes) {
          // Resumes loaded, but specific one not found
          toast({ title: "Not Found", description: "Resume not found. Starting a new one.", variant: "destructive" });
          router.replace('/resumes/builder'); // Clear ID from URL
          setIsLoadingExisting(false);
        }
      }
      if(loadingResumes) {
        // Wait for resumes to load
        const checkInterval = setInterval(() => {
          if(!loadingResumes) {
            clearInterval(checkInterval);
            loadExisting();
          }
        }, 100);
      } else {
        loadExisting();
      }

    } else {
        // Reset to default for new resume
        setResumeName('Untitled Resume');
        setSelectedTemplate(templates[0].id);
        setResumeData(initialResumeData);
        setEditingResumeId(null);
    }
  }, [searchParams, getResumeById, loadingResumes, router, toast]);


  const handleResumeDataChange = useCallback((newDa_ta: ResumeData) => {
    setResumeData(newDa_ta);
  }, []);

  const handleSaveResume = async () => {
    if (!resumeName.trim()) {
      toast({ title: "Input Required", description: "Please enter a name for your resume.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const resumeToSave: Omit<Resume, 'id' | 'lastUpdated' | 'userId'> = {
      name: resumeName,
      templateId: selectedTemplate,
      structuredData: resumeData,
      content: JSON.stringify(resumeData), // Store stringified JSON in content for now, or create a plain text version
      summary: resumeData.summary, // if using the builder's summary field directly
    };

    try {
      if (editingResumeId) {
        await updateResume(editingResumeId, resumeToSave);
        toast({ title: "Success", description: "Resume updated successfully." });
      } else {
        const newId = await addResume(resumeToSave);
        if (newId) {
          setEditingResumeId(newId); // Switch to edit mode for the newly created resume
          router.replace(`/resumes/builder?id=${newId}`); // Update URL
          toast({ title: "Success", description: "Resume saved successfully." });
        } else {
          throw new Error("Failed to save new resume.");
        }
      }
    } catch (error) {
      console.error("Error saving resume:", error);
      toast({ title: "Error", description: `Could not save resume. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingExisting && editingResumeId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading resume data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/resumes')} className="text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Resumes
        </Button>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input 
            placeholder="Resume Name" 
            value={resumeName} 
            onChange={(e) => setResumeName(e.target.value)}
            className="flex-grow md:flex-grow-0 md:w-64"
          />
          <Button onClick={handleSaveResume} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {editingResumeId ? 'Save Changes' : 'Save Resume'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resume Builder</CardTitle>
          <CardDescription>
            {editingResumeId ? `Editing: ${resumeName}` : 'Create a new professional resume.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="template-select" className="mb-2 block font-semibold">Choose a Template:</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {templates.map(template => (
                <Card 
                  key={template.id} 
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`cursor-pointer transition-all ${selectedTemplate === template.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}
                >
                  <CardHeader className="p-3">
                    {template.image && <img data-ai-hint="resume template" src={template.image} alt={template.name} className="w-full h-auto object-contain rounded-sm mb-2 aspect-[3/4]" />}
                    <CardTitle className="text-md">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-xs">
                    <p>{template.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ResumeForm initialData={resumeData} onChange={handleResumeDataChange} />
        </div>
        <div className="lg:col-span-2">
          <Card className="sticky top-4"> {/* Sticky preview */}
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Live Preview</CardTitle>
              <Badge variant="outline">{templates.find(t => t.id === selectedTemplate)?.name}</Badge>
            </CardHeader>
            <CardContent className="min-h-[800px] bg-muted/30 p-2 md:p-4">
              <ResumePreview templateId={selectedTemplate} data={resumeData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
