"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeneratedCoverLetterDisplayProps {
  coverLetterText: string;
}

export function GeneratedCoverLetterDisplay({ coverLetterText }: GeneratedCoverLetterDisplayProps) {
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    if (!coverLetterText) return;
    navigator.clipboard.writeText(coverLetterText)
      .then(() => {
        toast({ title: "Copied!", description: "Cover letter copied to clipboard." });
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({ title: "Copy Failed", description: "Could not copy to clipboard.", variant: "destructive" });
      });
  };

  if (!coverLetterText) {
    return null; // Don't render if no text
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-xl">Generated Cover Letter</CardTitle>
        <Button onClick={handleCopyToClipboard} variant="outline" size="sm">
          <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] lg:h-[500px] p-4 border rounded-md bg-background">
          <pre className="text-sm whitespace-pre-wrap font-sans">{coverLetterText}</pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
