"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { KeywordExtractionResult } from '@/lib/context/types';

interface AnalysisResultsData {
  jdKeywords: KeywordExtractionResult;
  matchingKeywords: string[];
  missingKeywords: string[];
  matchScore: number;
  qualitativeAssessment: string;
}

interface KeywordAnalysisResultsProps {
  results: AnalysisResultsData;
  jobDescriptionText: string;
  resumeContentText: string;
}

export function KeywordAnalysisResults({ results, jobDescriptionText, resumeContentText }: KeywordAnalysisResultsProps) {
  
  const highlightText = (text: string, keywords: string[], colorClass: string) => {
    if (!keywords || keywords.length === 0 || !text) return text;
    const escapedKeywords = keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'gi');
    
    return text.split(regex).map((part, index) => 
      regex.test(part) ? <mark key={index} className={colorClass}>{part}</mark> : part
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Analysis Results</CardTitle>
        <div className="flex items-center gap-4 mt-2">
          <Progress value={results.matchScore} className="w-full h-3" />
          <span className="text-lg font-semibold text-primary">
            {results.matchScore.toFixed(0)}%
          </span>
          <Badge variant={
            results.qualitativeAssessment === "Strong Match" ? "default" :
            results.qualitativeAssessment === "Moderate Match" ? "secondary" :
            "destructive"
          } className={
             results.qualitativeAssessment === "Strong Match" ? "bg-green-500 text-white" :
             results.qualitativeAssessment === "Moderate Match" ? "bg-yellow-500 text-black" :
             "bg-red-500 text-white"
          }>
            {results.qualitativeAssessment}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-lg mb-2 text-green-600 dark:text-green-400">Matching Keywords ({results.matchingKeywords.length})</h3>
          <ScrollArea className="h-48 p-2 border rounded-md bg-green-50 dark:bg-green-900/30">
            {results.matchingKeywords.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {results.matchingKeywords.map((kw, i) => <li key={`match-${i}`} className="text-sm">{kw}</li>)}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No direct matches found.</p>}
          </ScrollArea>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2 text-red-600 dark:text-red-400">Missing Keywords ({results.missingKeywords.length})</h3>
          <ScrollArea className="h-48 p-2 border rounded-md bg-red-50 dark:bg-red-900/30">
             {results.missingKeywords.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {results.missingKeywords.map((kw, i) => <li key={`miss-${i}`} className="text-sm">{kw}</li>)}
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
                    {results.jdKeywords.skills.map((skill, i) => <Badge key={`skill-${i}`} variant="outline">{skill}</Badge>)}
                    {results.jdKeywords.skills.length === 0 && <p className="text-xs text-muted-foreground">None extracted.</p>}
                    </div>
                </div>
                <div>
                    <h4 className="font-medium text-md">Technologies:</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                    {results.jdKeywords.technologies.map((tech, i) => <Badge key={`tech-${i}`} variant="outline">{tech}</Badge>)}
                    {results.jdKeywords.technologies.length === 0 && <p className="text-xs text-muted-foreground">None extracted.</p>}
                    </div>
                </div>
                <div>
                    <h4 className="font-medium text-md">Responsibilities (Keywords):</h4>
                     <div className="flex flex-wrap gap-2 mt-1">
                    {results.jdKeywords.responsibilities.map((resp, i) => <Badge key={`resp-${i}`} variant="outline">{resp}</Badge>)}
                     {results.jdKeywords.responsibilities.length === 0 && <p className="text-xs text-muted-foreground">None extracted.</p>}
                    </div>
                </div>
            </div>
        </div>
        <div className="md:col-span-2 mt-4 p-4 border rounded-md bg-sky-50 dark:bg-sky-900/30">
            <h3 className="font-semibold text-lg mb-2 text-sky-700 dark:text-sky-300">Job Description (Highlighted)</h3>
            <ScrollArea className="h-64">
             <p className="text-sm whitespace-pre-wrap">
                 {highlightText(jobDescriptionText, results.matchingKeywords, 'bg-green-200 dark:bg-green-700')}
             </p>
            </ScrollArea>
        </div>
         <div className="md:col-span-2 mt-4 p-4 border rounded-md bg-purple-50 dark:bg-purple-900/30">
            <h3 className="font-semibold text-lg mb-2 text-purple-700 dark:text-purple-300">Resume Content (Highlighted)</h3>
            <ScrollArea className="h-64">
             <p className="text-sm whitespace-pre-wrap">
                 {highlightText(resumeContentText, results.matchingKeywords, 'bg-green-200 dark:bg-green-700')}
             </p>
            </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
