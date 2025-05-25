
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
        // Should ideally not happen if a template is always selected
        return <ClassicTemplate data={data} />; // Fallback to classic or a default message
    }
  };

  // The preview area itself should resemble an A4 paper.
  // A4 dimensions: 210mm x 297mm. At 96 DPI, this is approx 794px x 1123px.
  // We'll use a fixed width and min-height to simulate this.
  // The content inside will be scaled down to fit if it's too large,
  // or it will scroll if the content overflows the A4 height.
  return (
    <ScrollArea className="w-full h-[calc(100vh-180px)] bg-slate-200"> 
      <div 
        className="mx-auto my-4 bg-white shadow-2xl overflow-hidden" 
        style={{ 
            width: '210mm', /* A4 width */
            minHeight: '297mm', /* A4 height */
            // padding: '0.75in' /* Common resume margin */
            // The padding will be handled by individual templates to better control layout
         }}
        id="resume-preview-content" // For potential PDF export
      >
        {renderTemplate()}
      </div>
    </ScrollArea>
  );
}
