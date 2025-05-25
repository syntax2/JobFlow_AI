
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useResume } from '@/lib/context/ResumeProvider';
import { generateTailoredCoverLetter as generateCoverLetterAI } from '@/ai/flows/generate-cover-letter';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Copy, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

export default function CoverLetterGeneratorPage() {
  const { selectedResume, resumes, setSelectedResumeId, loadingResumes } = useResume();
  const { toast } = useToast();
  const [jobDescription, setJobDescription] = useState('');
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select first resume if none is selected and resumes are loaded
  useEffect(() => {
    if (!loadingResumes && !selectedResume && resumes.length > 0) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [loadingResumes, selectedResume, resumes, setSelectedResumeId]);

  const handleGenerateCoverLetter = async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Input Required", description: "Please paste a job description.", variant: "destructive" });
      return;
    }
    if (!selectedResume || !selectedResume.content) {
      toast({ title: "Resume Required", description: "Please select a resume with content.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setGeneratedCoverLetter('');

    try {
      const result = await generateCoverLetterAI({
        jobDescription,
        selectedResume: selectedResume.content,
      });
      setGeneratedCoverLetter(result.coverLetter);
      toast({ title: "Cover Letter Generated", description: "Your tailored cover letter is ready." });
    } catch (error) {
      console.error("Error generating cover letter:", error);
      toast({ title: "Generation Failed", description: `Could not generate cover letter. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedCoverLetter) return;
    navigator.clipboard.writeText(generatedCoverLetter)
      .then(() => {
        toast({ title: "Copied!", description: "Cover letter copied to clipboard." });
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({ title: "Copy Failed", description: "Could not copy to clipboard.", variant: "destructive" });
      });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Dynamic Cover Letter Generator</CardTitle>
          <CardDescription>Create compelling, tailored cover letters powered by AI, based on your resume and the job description.</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedResume && !loadingResumes && resumes.length > 0 && (
            <div className="p-4 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg" role="alert">
              <span className="font-medium">No resume selected!</span> Please select a resume from the 'Resumes' page, or one will be auto-selected if available.
            </div>
          )}
          {!selectedResume && loadingResumes && (
             <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg flex items-center" role="alert">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading resumes...
            </div>
          )}
           {!selectedResume && !loadingResumes && resumes.length === 0 && (
             <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
               <span className="font-medium">No resumes found!</span> Please add a resume on the 'Resumes' page first.
            </div>
           )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="jobDescription" className="text-lg font-semibold">Job Description</Label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="min-h-[200px] mt-2 border-2 border-dashed border-primary/50 focus:border-primary"
              />
            </div>
            <div>
              <Label className="text-lg font-semibold">Selected Resume: {selectedResume ? selectedResume.name : "None"}</Label>
              <ScrollArea className="mt-2 min-h-[200px] max-h-[400px] p-3 border rounded-md bg-muted/30">
                {selectedResume?.content ? (
                  <p className="text-sm whitespace-pre-wrap">{selectedResume.content}</p>
                ) : (
                  <p className="text-muted-foreground">Select a resume to see its content here.</p>
                )}
              </ScrollArea>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <Button onClick={handleGenerateCoverLetter} disabled={isLoading || !selectedResume || !jobDescription.trim()} size="lg">
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
              Generate Cover Letter
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="mt-6">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">AI is crafting your cover letter... this may take a moment.</p>
          </CardContent>
        </Card>
      )}

      {generatedCoverLetter && !isLoading && (
        <Card className="mt-6 shadow-md">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="text-xl">Generated Cover Letter</CardTitle>
            <Button onClick={handleCopyToClipboard} variant="outline" size="sm">
              <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] lg:h-[500px] p-4 border rounded-md bg-background">
              <pre className="text-sm whitespace-pre-wrap font-sans">{generatedCoverLetter}</pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
