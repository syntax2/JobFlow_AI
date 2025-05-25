
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useResume } from '@/lib/context/ResumeProvider';
import type { KeywordExtractionResult } from '@/lib/context/types';
import { extractKeywords as extractKeywordsAI } from '@/ai/flows/extract-keywords';
import { useToast } from '@/hooks/use-toast';
import { Loader2, SearchCheck, AlertTriangle, Percent } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label'; // Added Label import

interface AnalysisResults {
  jdKeywords: KeywordExtractionResult;
  resumeKeywords: string[]; // simple list of words from resume for now
  matchingKeywords: string[];
  missingKeywords: string[];
  matchScore: number; // Percentage
  qualitativeAssessment: string;
}

export default function KeywordMatcherPage() {
  const { selectedResume, resumes, setSelectedResumeId, loadingResumes } = useResume();
  const { toast } = useToast();
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);

  // Auto-select first resume if none is selected and resumes are loaded
  useEffect(() => {
    if (!loadingResumes && !selectedResume && resumes.length > 0) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [loadingResumes, selectedResume, resumes, setSelectedResumeId]);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Input Required", description: "Please paste a job description.", variant: "destructive" });
      return;
    }
    if (!selectedResume || !selectedResume.content) {
      toast({ title: "Resume Required", description: "Please select a resume with content.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setAnalysisResults(null);

    try {
      const jdKeywordsResult = await extractKeywordsAI({ jobDescription });
      
      const allJdKeywords = [
        ...new Set([...jdKeywordsResult.skills, ...jdKeywordsResult.technologies, ...jdKeywordsResult.responsibilities.flatMap(r => r.toLowerCase().split(/\W+/).filter(Boolean))])
      ].map(k => k.toLowerCase());


      const resumeTextLower = selectedResume.content.toLowerCase();
      const resumeWords = new Set(resumeTextLower.split(/\W+/).filter(Boolean));

      const matchingKeywords: string[] = [];
      const missingKeywords: string[] = [];

      allJdKeywords.forEach(jdKeyword => {
        // More robust matching: check if the keyword (potentially multi-word) is present in the resume text
        if (resumeTextLower.includes(jdKeyword)) {
          matchingKeywords.push(jdKeyword);
        } else {
          missingKeywords.push(jdKeyword);
        }
      });
      
      const uniqueJdKeywordsCount = allJdKeywords.length;
      const matchScore = uniqueJdKeywordsCount > 0 ? (matchingKeywords.length / uniqueJdKeywordsCount) * 100 : 0;

      let qualitativeAssessment = "Low Match";
      if (matchScore >= 75) qualitativeAssessment = "Strong Match";
      else if (matchScore >= 50) qualitativeAssessment = "Moderate Match";
      else if (matchScore >= 25) qualitativeAssessment = "Fair Match";

      setAnalysisResults({
        jdKeywords: jdKeywordsResult,
        resumeKeywords: Array.from(resumeWords), // For potential display, not used in score
        matchingKeywords,
        missingKeywords,
        matchScore,
        qualitativeAssessment,
      });

      toast({ title: "Analysis Complete", description: "Keyword analysis finished." });
    } catch (error) {
      console.error("Error analyzing keywords:", error);
      toast({ title: "Analysis Failed", description: `Could not analyze keywords. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const highlightText = (text: string, keywords: string[], colorClass: string) => {
    if (!keywords || keywords.length === 0) return text;
    // Create a regex that matches any of the keywords, case-insensitive
    // Escape special characters in keywords
    const escapedKeywords = keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'gi');
    
    return text.split(regex).map((part, index) => 
      regex.test(part) ? <mark key={index} className={colorClass}>{part}</mark> : part
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Intelligent Keyword Matcher</CardTitle>
          <CardDescription>Analyze job descriptions against your resume to identify key skills and optimize your application.</CardDescription>
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
                   <p className="text-sm whitespace-pre-wrap">
                     {analysisResults 
                       ? highlightText(selectedResume.content, analysisResults.matchingKeywords, 'bg-green-200 dark:bg-green-700')
                       : selectedResume.content}
                   </p>
                ) : (
                  <p className="text-muted-foreground">Select a resume to see its content here.</p>
                )}
              </ScrollArea>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <Button onClick={handleAnalyze} disabled={isLoading || !selectedResume || !jobDescription.trim()} size="lg">
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <SearchCheck className="mr-2 h-5 w-5" />}
              Analyze Keywords
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="mt-6">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">AI is analyzing... this may take a moment.</p>
          </CardContent>
        </Card>
      )}

      {analysisResults && !isLoading && (
        <Card className="mt-6 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Analysis Results</CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <Progress value={analysisResults.matchScore} className="w-full h-3" />
              <span className="text-lg font-semibold text-primary">
                {analysisResults.matchScore.toFixed(0)}%
              </span>
              <Badge variant={
                analysisResults.qualitativeAssessment === "Strong Match" ? "default" :
                analysisResults.qualitativeAssessment === "Moderate Match" ? "secondary" :
                "destructive"
              } className={
                 analysisResults.qualitativeAssessment === "Strong Match" ? "bg-green-500 text-white" :
                 analysisResults.qualitativeAssessment === "Moderate Match" ? "bg-yellow-500 text-black" :
                 "bg-red-500 text-white"
              }>
                {analysisResults.qualitativeAssessment}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-green-600 dark:text-green-400">Matching Keywords ({analysisResults.matchingKeywords.length})</h3>
              <ScrollArea className="h-48 p-2 border rounded-md bg-green-50 dark:bg-green-900/30">
                {analysisResults.matchingKeywords.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {analysisResults.matchingKeywords.map((kw, i) => <li key={`match-${i}`} className="text-sm">{kw}</li>)}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">No direct matches found.</p>}
              </ScrollArea>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-red-600 dark:text-red-400">Missing Keywords ({analysisResults.missingKeywords.length})</h3>
              <ScrollArea className="h-48 p-2 border rounded-md bg-red-50 dark:bg-red-900/30">
                 {analysisResults.missingKeywords.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {analysisResults.missingKeywords.map((kw, i) => <li key={`miss-${i}`} className="text-sm">{kw}</li>)}
                  </ul>
                 ) : <p className="text-sm text-muted-foreground">Great job! No missing keywords from JD.</p>}
              </ScrollArea>
            </div>
            <div className="md:col-span-2">
                <h3 className="font-semibold text-lg mb-2">Keywords from Job Description</h3>
                <div className="space-y-3">
                    <div>
                        <h4 className="font-medium text-md">Skills:</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                        {analysisResults.jdKeywords.skills.map((skill, i) => <Badge key={`skill-${i}`} variant="outline">{skill}</Badge>)}
                        {analysisResults.jdKeywords.skills.length === 0 && <p className="text-xs text-muted-foreground">None extracted.</p>}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-md">Technologies:</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                        {analysisResults.jdKeywords.technologies.map((tech, i) => <Badge key={`tech-${i}`} variant="outline">{tech}</Badge>)}
                        {analysisResults.jdKeywords.technologies.length === 0 && <p className="text-xs text-muted-foreground">None extracted.</p>}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-md">Responsibilities (Keywords):</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                        {analysisResults.jdKeywords.responsibilities.map((resp, i) => <Badge key={`resp-${i}`} variant="outline">{resp}</Badge>)}
                         {analysisResults.jdKeywords.responsibilities.length === 0 && <p className="text-xs text-muted-foreground">None extracted.</p>}
                        </div>
                    </div>
                </div>
            </div>
             <div className="md:col-span-2 mt-4 p-4 border rounded-md bg-sky-50 dark:bg-sky-900/30">
                <h3 className="font-semibold text-lg mb-2 text-sky-700 dark:text-sky-300">Job Description (Highlighted)</h3>
                <ScrollArea className="h-64">
                 <p className="text-sm whitespace-pre-wrap">
                     {highlightText(jobDescription, analysisResults.matchingKeywords, 'bg-green-200 dark:bg-green-700')}
                 </p>
                </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
