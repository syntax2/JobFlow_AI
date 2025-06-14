
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import type { Resume, ResumeData, ResumeTemplateId } from './types';
import { useFirebase } from '../firebase/FirebaseProvider';
import { collection, onSnapshot, orderBy, query, where, Timestamp, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { APP_ID } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import { summarizeResume as summarizeResumeAI } from '@/ai/flows/summarize-resume';

interface ResumeContextType {
  resumes: Resume[];
  selectedResume: Resume | null;
  setSelectedResumeId: (id: string | null) => void;
  addResume: (resumeData: Omit<Resume, 'id' | 'lastUpdated' | 'userId' >) => Promise<string | null>;
  updateResume: (id: string, resumeData: Partial<Omit<Resume, 'id' | 'userId'>>) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  loadingResumes: boolean;
  getResumeById: (id: string) => Resume | undefined;
  summarizeResumeContent: (resumeId: string, resumeText: string) => Promise<void>;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const useResume = (): ResumeContextType => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};

export const ResumeProvider = ({ children }: { children: ReactNode }) => {
  const { db, userId, appId } = useFirebase();
  const { toast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [loadingResumes, setLoadingResumes] = useState(true);

  useEffect(() => {
    if (!db || !userId || !appId) {
      setLoadingResumes(false);
      setResumes([]);
      return;
    }

    setLoadingResumes(true);
    const resumesColPath = `artifacts/${appId}/users/${userId}/resumes`;
    const q = query(collection(db, resumesColPath)/*, orderBy('lastUpdated', 'desc')*/); 

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedResumes: Resume[] = [];
        querySnapshot.forEach((doc) => {
          fetchedResumes.push({ id: doc.id, ...doc.data() } as Resume);
        });
        
        fetchedResumes.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        setResumes(fetchedResumes);
        
        if (selectedResume) {
          const updatedSelected = fetchedResumes.find(r => r.id === selectedResume.id);
          setSelectedResume(updatedSelected || null);
        } else if (fetchedResumes.length > 0 && !selectedResume) {
           if (!fetchedResumes[0].templateId) { 
            setSelectedResume(fetchedResumes[0]);
           }
        }
        setLoadingResumes(false);
      },
      (error) => {
        console.error('Error fetching resumes:', error);
        toast({ title: "Error", description: "Could not fetch resumes.", variant: "destructive" });
        setLoadingResumes(false);
      }
    );

    return () => unsubscribe();
  }, [db, userId, appId, toast, selectedResume]); // selectedResume removed from dep array to avoid potential loops if it causes re-fetches itself.

  const setSelectedResumeId = useCallback((id: string | null) => {
    if (id === null) {
      setSelectedResume(null);
    } else {
      const resume = resumes.find(r => r.id === id); // resumes from state
      setSelectedResume(resume || null);
    }
  }, [resumes]); // Depends on the current list of resumes

  const addResume = async (resumeData: Omit<Resume, 'id' | 'lastUpdated' | 'userId'>): Promise<string | null> => {
    if (!db || !userId || !appId) {
      toast({ title: "Error", description: "Database not available.", variant: "destructive" });
      return null;
    }
    try {
      const resumesColPath = `artifacts/${appId}/users/${userId}/resumes`;
      
      const dataToSave: Omit<Resume, 'id'> = {
        name: resumeData.name,
        content: resumeData.content || '', 
        userId,
        lastUpdated: Timestamp.now().toDate().toISOString(),
        summary: resumeData.summary, 
        templateId: resumeData.templateId,
        structuredData: resumeData.structuredData || { personalInfo: { photoUrl: resumeData.structuredData?.personalInfo?.photoUrl || '' } }, // ensure photoUrl path
      };

      const newResumeRef = await addDoc(collection(db, resumesColPath), dataToSave);
      toast({ title: "Success", description: "Resume added successfully." });
      return newResumeRef.id;
    } catch (error) {
      console.error("Error adding resume:", error);
      toast({ title: "Error", description: "Could not add resume.", variant: "destructive" });
      return null;
    }
  };

  const updateResume = async (id: string, resumeData: Partial<Omit<Resume, 'id' | 'userId'>>) => {
    if (!db || !userId || !appId) {
      toast({ title: "Error", description: "Database not available.", variant: "destructive" });
      return;
    }
    try {
      const resumeDocPath = `artifacts/${appId}/users/${userId}/resumes/${id}`;
      
      const dataToUpdate: any = { // Use any for flexibility with partial updates
        ...resumeData,
        lastUpdated: Timestamp.now().toDate().toISOString(),
      };

      // Ensure structuredData and personalInfo exist if photoUrl is being updated
      if (resumeData.structuredData?.personalInfo?.photoUrl !== undefined) {
        if (!dataToUpdate.structuredData) dataToUpdate.structuredData = {};
        if (!dataToUpdate.structuredData.personalInfo) dataToUpdate.structuredData.personalInfo = {};
        dataToUpdate.structuredData.personalInfo.photoUrl = resumeData.structuredData.personalInfo.photoUrl;
      }


      await updateDoc(doc(db, resumeDocPath), dataToUpdate);
      toast({ title: "Success", description: "Resume updated successfully." });
    } catch (error) {
      console.error("Error updating resume:", error);
      toast({ title: "Error", description: "Could not update resume.", variant: "destructive" });
    }
  };
  
  const deleteResume = async (id: string) => {
    if (!db || !userId || !appId) {
      toast({ title: "Error", description: "Database not available.", variant: "destructive" });
      return;
    }
    try {
      const resumeDocPath = `artifacts/${appId}/users/${userId}/resumes/${id}`;
      await deleteDoc(doc(db, resumeDocPath));
      toast({ title: "Success", description: "Resume deleted successfully." });
      if (selectedResume?.id === id) {
        setSelectedResume(null); 
      }
    } catch (error) {
      console.error("Error deleting resume:", error);
      toast({ title: "Error", description: "Could not delete resume.", variant: "destructive" });
    }
  };

  const getResumeById = (id: string): Resume | undefined => {
    return resumes.find(r => r.id === id);
  };

  const summarizeResumeContent = async (resumeId: string, resumeText: string) => {
    if (!db || !userId || !appId) {
      toast({ title: "Error", description: "AI service not available.", variant: "destructive" });
      return;
    }
    if (!resumeText.trim()) {
      toast({ title: "Input Required", description: "Resume content is empty, cannot summarize.", variant: "destructive" });
      return;
    }
    try {
      toast({ title: "AI Processing", description: "Summarizing resume content..." });
      const result = await summarizeResumeAI({ resumeText });
      if (result.summary) {
        await updateResume(resumeId, { summary: result.summary });
        toast({ title: "Success", description: "Resume summary generated and saved." });
      } else {
        throw new Error("AI did not return a summary.");
      }
    } catch (error)
      {
      console.error("Error summarizing resume:", error);
      toast({ title: "AI Error", description: `Could not summarize resume. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    }
  };


  return (
    <ResumeContext.Provider value={{ 
      resumes, 
      selectedResume, 
      setSelectedResumeId,
      addResume,
      updateResume,
      deleteResume,
      loadingResumes,
      getResumeById,
      summarizeResumeContent,
    }}>
      {children}
    </ResumeContext.Provider>
  );
};
