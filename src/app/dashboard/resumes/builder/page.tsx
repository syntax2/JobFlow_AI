
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ResumeForm } from '@/components/resume-builder/ResumeForm';
import { ResumePreview } from '@/components/resume-builder/ResumePreview';
import type { Resume, ResumeData, ResumeTemplateId, ResumeJsonExport } from '@/lib/context/types';
import { useResume } from '@/lib/context/ResumeProvider';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Eye, Loader2, Download, Upload, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; 
import { Badge } from '@/components/ui/badge'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image'; // Keep for template images if any


const initialResumeData: ResumeData = {
  personalInfo: { fullName: '', jobTitle: '', email: '', phone: '', linkedin: '', portfolio: '', address: '', photoUrl: '' },
  summary: '',
  experience: [{ id: uuidv4(), jobTitle: '', company: '', location: '', startDate: '', endDate: '', description: '' }],
  education: [{ id: uuidv4(), degree: '', institution: '', location: '', graduationYear: '', description: '' }],
  skills: [{ id: uuidv4(), name: '' }],
  customSections: [],
};

const templates: { id: ResumeTemplateId; name: string; description: string; image?: string; dataAiHint?: string; }[] = [
  { id: 'modern', name: 'Modern', description: 'A sleek, two-column design.', image: 'https://placehold.co/300x400.png?text=Modern+Template&textColor=ffffff&bgColor=64B5F6', dataAiHint: "resume modern" },
  { id: 'classic', name: 'Classic', description: 'A traditional single-column layout.', image: 'https://placehold.co/300x400.png?text=Classic+Template&textColor=333333&bgColor=F0F8FF', dataAiHint: "resume classic" },
  { id: 'ivy-league', name: 'Ivy League', description: 'A formal, academic-focused style.', image: 'https://placehold.co/300x400.png?text=Ivy+League&textColor=ffffff&bgColor=957DAD', dataAiHint: "resume formal" },
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
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const resumeId = searchParams.get('id');
    if (resumeId) {
      setIsLoadingExisting(true);
      setEditingResumeId(resumeId);
      
      const loadExisting = () => {
        const existingResume = getResumeById(resumeId);
        if (existingResume) {
          setResumeName(existingResume.name);
          setSelectedTemplate(existingResume.templateId || templates[0].id);
          // Ensure initialResumeData structure is preserved if parts of structuredData are missing
          setResumeData({
            ...initialResumeData, // Start with default structure
            ...(existingResume.structuredData || {}), // Overlay existing data
            personalInfo: { // Ensure personalInfo and its fields exist
              ...initialResumeData.personalInfo,
              ...(existingResume.structuredData?.personalInfo || {}),
            },
            // Ensure arrays are not undefined
            experience: existingResume.structuredData?.experience || initialResumeData.experience,
            education: existingResume.structuredData?.education || initialResumeData.education,
            skills: existingResume.structuredData?.skills || initialResumeData.skills,
            customSections: existingResume.structuredData?.customSections || initialResumeData.customSections,
          });
          setIsLoadingExisting(false);
        } else if (!loadingResumes) {
          toast({ title: "Not Found", description: "Resume not found. Starting a new one.", variant: "destructive" });
          router.replace('/dashboard/resumes/builder'); 
          setIsLoadingExisting(false);
        }
      };

      if(loadingResumes) {
        const checkInterval = setInterval(() => {
          // Directly call loadingResumes from the hook inside the interval
          // This requires useResume to be stable or the interval to re-evaluate it.
          // For simplicity, assuming useResume() is stable or this effect reruns if it changes significantly.
          const currentContextIsLoading = useResume().loadingResumes;
          if(!currentContextIsLoading) { // Check the fresh value
            clearInterval(checkInterval);
            loadExisting();
          }
        }, 100);
        return () => clearInterval(checkInterval);
      } else {
        loadExisting();
      }

    } else {
        setResumeName('Untitled Resume');
        setSelectedTemplate(templates[0].id);
        setResumeData(JSON.parse(JSON.stringify(initialResumeData))); // Deep copy for new resume
        setEditingResumeId(null);
    }
  }, [searchParams, getResumeById, loadingResumes, router, toast]); // Removed useResume from deps as it's a hook call


  const handleResumeDataChange = useCallback((newData: ResumeData) => {
    setResumeData(newData);
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
      content: "Resume built with CareerCompass AI Builder.", // Placeholder for non-plain text resumes
      summary: resumeData.summary, 
    };

    try {
      if (editingResumeId) {
        await updateResume(editingResumeId, resumeToSave);
        toast({ title: "Success", description: "Resume updated successfully." });
      } else {
        const newId = await addResume(resumeToSave);
        if (newId) {
          setEditingResumeId(newId); 
          router.replace(`/dashboard/resumes/builder?id=${newId}`); 
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

  const handleDownloadJson = () => {
    const exportData: ResumeJsonExport = {
      resumeName,
      templateId: selectedTemplate,
      structuredData: resumeData,
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeResumeName = resumeName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeResumeName}_careercompass.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Resume data downloaded as JSON." });
  };

  const handleUploadJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsedData: ResumeJsonExport = JSON.parse(text);
          if (parsedData.resumeName && parsedData.templateId && parsedData.structuredData) {
            setResumeName(parsedData.resumeName);
            setSelectedTemplate(parsedData.templateId);
            // Ensure all sections, especially personalInfo, are correctly defaulted if missing in JSON
            setResumeData({
                ...initialResumeData, // Start with default structure
                ...parsedData.structuredData, // Overlay with parsed data
                personalInfo: {
                    ...initialResumeData.personalInfo,
                    ...(parsedData.structuredData.personalInfo || {}),
                },
                experience: parsedData.structuredData.experience || initialResumeData.experience,
                education: parsedData.structuredData.education || initialResumeData.education,
                skills: parsedData.structuredData.skills || initialResumeData.skills,
                customSections: parsedData.structuredData.customSections || initialResumeData.customSections,
            });
            toast({ title: "Success", description: "Resume data imported successfully." });
          } else {
            throw new Error("Invalid JSON format for resume data.");
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
          toast({ title: "Import Error", description: `Could not import JSON. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
        }
      };
      reader.readAsText(file);
      // Reset file input value so onChange triggers for the same file if re-uploaded
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        <Button variant="ghost" onClick={() => router.push('/dashboard/resumes')} className="text-sm shrink-0">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Resumes
        </Button>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <Input 
            placeholder="Resume Name" 
            value={resumeName} 
            onChange={(e) => setResumeName(e.target.value)}
            className="flex-grow min-w-[200px]"
          />
          <div className="flex gap-2 shrink-0">
            <Button onClick={handleSaveResume} disabled={isSaving} size="sm" className="flex-1 sm:flex-none">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {editingResumeId ? 'Save Changes' : 'Save Resume'}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Upload className="mr-2 h-4 w-4" /> Import
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Import resume from JSON</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Input type="file" ref={fileInputRef} onChange={handleUploadJson} accept=".json" className="hidden" />

            <TooltipProvider>
               <Tooltip>
                <TooltipTrigger asChild>
                    <Button onClick={handleDownloadJson} variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Download resume as JSON</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" disabled className="flex-1 sm:flex-none">
                            <FileText className="mr-2 h-4 w-4" /> PDF
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Download as PDF (Coming Soon)</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Resume Builder</CardTitle>
          <CardDescription>
            {editingResumeId ? `Editing: ${resumeName}` : 'Create a new professional resume.'}
            {/* Placeholder for PDF download info: This feature is complex and involves libraries like html2pdf.js or jsPDF. */}
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
                  className={`cursor-pointer transition-all group hover:shadow-xl ${selectedTemplate === template.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}
                >
                  <CardHeader className="p-0 relative">
                    {template.image && (
                        <Image 
                            data-ai-hint={template.dataAiHint || "resume template"} 
                            src={template.image} 
                            alt={template.name} 
                            width={300}
                            height={400}
                            className="w-full h-auto object-contain rounded-t-sm aspect-[3/4]" 
                        />
                    )}
                    <div className={`absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center ${selectedTemplate === template.id ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                       <Eye className="w-10 h-10 text-white/70" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    <CardTitle className="text-md">{template.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1">
          <ResumeForm initialData={resumeData} onChange={handleResumeDataChange} />
        </div>
        <div className="lg:col-span-2">
          <Card className="sticky top-4 shadow-xl">
            <CardHeader className="flex flex-row justify-between items-center py-3 px-4 border-b">
              <CardTitle className="text-lg">Live Preview</CardTitle>
              <Badge variant="outline">{templates.find(t => t.id === selectedTemplate)?.name}</Badge>
            </CardHeader>
            <CardContent className="min-h-[calc(100vh-120px)] bg-slate-200 p-2 md:p-4">
              <ResumePreview templateId={selectedTemplate} data={resumeData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
