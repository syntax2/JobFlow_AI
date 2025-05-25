
"use client";

import React from 'react';
import type { ResumeData, ResumeTemplateId } from '@/lib/context/types';
import { ModernTemplate } from '@/components/resume-templates/ModernTemplate';
import { ClassicTemplate } from '@/components/resume-templates/ClassicTemplate';
import { IvyLeagueTemplate } from '@/components/resume-templates/IvyLeagueTemplate';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResumePreviewProps {
  templateId: ResumeTemplateId;
  data: ResumeData;
}

export function ResumePreview({ templateId, data }: ResumePreviewProps) {
  const renderTemplate = () => {
    switch (templateId) {
      case 'modern':
        return <ModernTemplate data={data} />;
      case 'classic':
        return <ClassicTemplate data={data} />;
      case 'ivy-league':
        return <IvyLeagueTemplate data={data} />;
      default:
        return <p className="text-center text-muted-foreground">Select a template to see the preview.</p>;
    }
  };

  // The preview area itself should resemble an A4 paper or standard resume document.
  // We can achieve this with fixed aspect ratio and max-width/height.
  // For simplicity in this component, we will just render the chosen template.
  // The "paper" styling can be part of the individual template components or a wrapper here.
  return (
    <ScrollArea className="h-[calc(100vh-200px)] max-h-[1123px] w-full overflow-auto"> 
      {/* A4 paper aspect ratio is roughly 1:1.414. Max width of 800px for 794px (A4 at 96dpi) */}
      {/* Styling to mimic paper will be inside template components */}
       <div className="mx-auto bg-white shadow-lg" style={{ width: '210mm', minHeight: '297mm', padding: '1in' }}> {/* Basic A4 styling */}
        {renderTemplate()}
      </div>
    </ScrollArea>
  );
}
