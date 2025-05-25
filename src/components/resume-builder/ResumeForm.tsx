
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ResumeData, PersonalInfo, WorkExperienceEntry, EducationEntry, SkillEntry, CustomSectionEntry } from '@/lib/context/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Trash2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image'; // For previewing uploaded photo

interface ResumeFormProps {
  initialData: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function ResumeForm({ initialData, onChange }: ResumeFormProps) {
  const [formData, setFormData] = useState<ResumeData>(initialData);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (section: keyof ResumeData, field: string, value: any, id?: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (id && Array.isArray(newData[section])) {
        const arraySection = newData[section] as Array<any>;
        const itemIndex = arraySection.findIndex(item => item.id === id);
        if (itemIndex > -1) {
          arraySection[itemIndex] = { ...arraySection[itemIndex], [field]: value };
        }
      } else if (typeof newData[section] === 'object' && newData[section] !== null && !Array.isArray(newData[section])) {
        (newData[section] as any)[field] = value;
      } else {
        (newData as any)[section] = value; // For direct fields like summary
      }
      onChange(newData); // Propagate change upwards
      return newData;
    });
  };
  
  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string) => {
     setFormData(prev => {
      const newPersonalInfo = { ...(prev.personalInfo || {}), [field]: value };
      const newData = { ...prev, personalInfo: newPersonalInfo };
      onChange(newData);
      return newData;
    });
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handlePersonalInfoChange('photoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const addToArraySection = (section: 'experience' | 'education' | 'skills' | 'customSections') => {
    setFormData(prev => {
      const newArray = [...(prev[section] || [])];
      let newItem: any;
      switch(section) {
        case 'experience': newItem = { id: uuidv4(), jobTitle: '', company: '', location: '', startDate: '', endDate: '', description: '' }; break;
        case 'education': newItem = { id: uuidv4(), degree: '', institution: '', location: '', graduationYear: '', description: '' }; break;
        case 'skills': newItem = { id: uuidv4(), name: '' }; break;
        case 'customSections': newItem = { id: uuidv4(), title: 'New Section', description: '' }; break;
        default: newItem = { id: uuidv4() };
      }
      newArray.push(newItem);
      const newData = { ...prev, [section]: newArray };
      onChange(newData);
      return newData;
    });
  };

  const removeFromArraySection = (section: 'experience' | 'education' | 'skills' | 'customSections', id: string) => {
    setFormData(prev => {
      const oldArray = prev[section] || [];
      const newArray = (oldArray as Array<any>).filter(item => item.id !== id);
      const newData = { ...prev, [section]: newArray };
      onChange(newData);
      return newData;
    });
  };

  const renderPersonalInfo = () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-4">
        {formData.personalInfo?.photoUrl ? (
          <Image 
            src={formData.personalInfo.photoUrl} 
            alt="Profile Preview" 
            width={80} 
            height={80} 
            className="rounded-full object-cover border"
            data-ai-hint="person portrait"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border">
            <ImageIcon className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <div>
          <Label htmlFor="photoUrl">Profile Photo (Optional)</Label>
          <Input 
            id="photoUrl" 
            type="file" 
            accept="image/*" 
            onChange={handlePhotoChange} 
            className="text-xs"
            ref={photoInputRef}
          />
          <Button 
            variant="link" 
            size="sm" 
            className="text-xs p-0 h-auto mt-1 text-destructive" 
            onClick={() => {
              handlePersonalInfoChange('photoUrl', '');
              if (photoInputRef.current) photoInputRef.current.value = '';
            }}
            disabled={!formData.personalInfo?.photoUrl}
          >
            Remove Photo
          </Button>
        </div>
      </div>
      <div><Label htmlFor="fullName">Full Name</Label><Input id="fullName" value={formData.personalInfo?.fullName || ''} onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)} placeholder="e.g., John Doe" required/></div>
      <div><Label htmlFor="jobTitle">Job Title</Label><Input id="jobTitle" value={formData.personalInfo?.jobTitle || ''} onChange={(e) => handlePersonalInfoChange('jobTitle', e.target.value)} placeholder="e.g., Senior Software Engineer" /></div>
      <div><Label htmlFor="email">Email</Label><Input type="email" id="email" value={formData.personalInfo?.email || ''} onChange={(e) => handlePersonalInfoChange('email', e.target.value)} placeholder="e.g., john.doe@example.com" /></div>
      <div><Label htmlFor="phone">Phone</Label><Input type="tel" id="phone" value={formData.personalInfo?.phone || ''} onChange={(e) => handlePersonalInfoChange('phone', e.target.value)} placeholder="e.g., (123) 456-7890" /></div>
      <div><Label htmlFor="linkedin">LinkedIn Profile URL</Label><Input type="url" id="linkedin" value={formData.personalInfo?.linkedin || ''} onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)} placeholder="e.g., linkedin.com/in/johndoe" /></div>
      <div><Label htmlFor="portfolio">Portfolio/Website URL</Label><Input type="url" id="portfolio" value={formData.personalInfo?.portfolio || ''} onChange={(e) => handlePersonalInfoChange('portfolio', e.target.value)} placeholder="e.g., github.com/johndoe" /></div>
      <div><Label htmlFor="address">Address (Optional)</Label><Input id="address" value={formData.personalInfo?.address || ''} onChange={(e) => handlePersonalInfoChange('address', e.target.value)} placeholder="e.g., City, Country" /></div>
    </div>
  );

  const renderSummary = () => (
    <div>
      <Label htmlFor="summary">Professional Summary/Objective</Label>
      <Textarea id="summary" value={formData.summary || ''} onChange={(e) => handleChange('summary' as any, '', e.target.value)} placeholder="Write a brief summary highlighting your key qualifications and career goals..." className="min-h-[100px]" />
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-4">
      {(formData.experience || []).map((exp) => (
        <Card key={exp.id} className="p-4 bg-muted/30">
          <div className="space-y-3">
            <div><Label htmlFor={`exp-jobTitle-${exp.id}`}>Job Title</Label><Input id={`exp-jobTitle-${exp.id}`} value={exp.jobTitle || ''} onChange={(e) => handleChange('experience', 'jobTitle', e.target.value, exp.id)} placeholder="e.g., Software Developer" /></div>
            <div><Label htmlFor={`exp-company-${exp.id}`}>Company</Label><Input id={`exp-company-${exp.id}`} value={exp.company || ''} onChange={(e) => handleChange('experience', 'company', e.target.value, exp.id)} placeholder="e.g., Tech Solutions Inc."/></div>
            <div><Label htmlFor={`exp-location-${exp.id}`}>Location</Label><Input id={`exp-location-${exp.id}`} value={exp.location || ''} onChange={(e) => handleChange('experience', 'location', e.target.value, exp.id)} placeholder="e.g., City, Country"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor={`exp-startDate-${exp.id}`}>Start Date</Label><Input id={`exp-startDate-${exp.id}`} type="text" placeholder="MM/YYYY or Present" value={exp.startDate || ''} onChange={(e) => handleChange('experience', 'startDate', e.target.value, exp.id)} /></div>
              <div><Label htmlFor={`exp-endDate-${exp.id}`}>End Date</Label><Input id={`exp-endDate-${exp.id}`} type="text" placeholder="MM/YYYY or Present" value={exp.endDate || ''} onChange={(e) => handleChange('experience', 'endDate', e.target.value, exp.id)} /></div>
            </div>
            <div><Label htmlFor={`exp-description-${exp.id}`}>Description/Responsibilities</Label><Textarea id={`exp-description-${exp.id}`} value={exp.description || ''} onChange={(e) => handleChange('experience', 'description', e.target.value, exp.id)} className="min-h-[100px]" placeholder="Use bullet points (e.g., - Developed feature X...)"/></div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => removeFromArraySection('experience', exp.id)} className="mt-2 text-destructive hover:text-destructive-foreground hover:bg-destructive">
            <Trash2 className="mr-1 h-3 w-3" /> Remove Experience
          </Button>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={() => addToArraySection('experience')}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
      </Button>
    </div>
  );
  
  const renderEducation = () => (
    <div className="space-y-4">
      {(formData.education || []).map((edu) => (
        <Card key={edu.id} className="p-4 bg-muted/30">
          <div className="space-y-3">
            <div><Label htmlFor={`edu-degree-${edu.id}`}>Degree/Certificate</Label><Input id={`edu-degree-${edu.id}`} value={edu.degree || ''} onChange={(e) => handleChange('education', 'degree', e.target.value, edu.id)} placeholder="e.g., B.S. in Computer Science"/></div>
            <div><Label htmlFor={`edu-institution-${edu.id}`}>Institution</Label><Input id={`edu-institution-${edu.id}`} value={edu.institution || ''} onChange={(e) => handleChange('education', 'institution', e.target.value, edu.id)} placeholder="e.g., University of Example"/></div>
            <div><Label htmlFor={`edu-location-${edu.id}`}>Location</Label><Input id={`edu-location-${edu.id}`} value={edu.location || ''} onChange={(e) => handleChange('education', 'location', e.target.value, edu.id)} placeholder="e.g., City, Country"/></div>
            <div><Label htmlFor={`edu-graduationYear-${edu.id}`}>Graduation Year/Dates</Label><Input id={`edu-graduationYear-${edu.id}`} type="text" placeholder="YYYY or MM/YYYY - MM/YYYY" value={edu.graduationYear || ''} onChange={(e) => handleChange('education', 'graduationYear', e.target.value, edu.id)} /></div>
            <div><Label htmlFor={`edu-description-${edu.id}`}>Description (GPA, Honors, etc.)</Label><Textarea id={`edu-description-${edu.id}`} value={edu.description || ''} onChange={(e) => handleChange('education', 'description', e.target.value, edu.id)} className="min-h-[80px]" placeholder="e.g., GPA: 3.8/4.0, Dean's List"/></div>
          </div>
           <Button variant="ghost" size="sm" onClick={() => removeFromArraySection('education', edu.id)} className="mt-2 text-destructive hover:text-destructive-foreground hover:bg-destructive">
            <Trash2 className="mr-1 h-3 w-3" /> Remove Education
          </Button>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={() => addToArraySection('education')}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Education
      </Button>
    </div>
  );

  const renderSkills = () => (
     <div className="space-y-4">
      {(formData.skills || []).map((skill) => (
        <Card key={skill.id} className="p-3 bg-muted/30">
          <div className="flex items-end gap-2">
            <div className="flex-grow"><Label htmlFor={`skill-name-${skill.id}`}>Skill</Label><Input id={`skill-name-${skill.id}`} value={skill.name || ''} onChange={(e) => handleChange('skills', 'name', e.target.value, skill.id)} placeholder="e.g., JavaScript, Project Management"/></div>
            <Button variant="ghost" size="icon" onClick={() => removeFromArraySection('skills', skill.id)} className="h-9 w-9 text-destructive hover:text-destructive-foreground hover:bg-destructive shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={() => addToArraySection('skills')}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
      </Button>
    </div>
  );

  const renderCustomSections = () => (
    <div className="space-y-4">
      {(formData.customSections || []).map((section) => (
        <Card key={section.id} className="p-4 bg-muted/30">
          <div className="space-y-3">
            <div><Label htmlFor={`custom-title-${section.id}`}>Section Title</Label><Input id={`custom-title-${section.id}`} value={section.title || ''} onChange={(e) => handleChange('customSections', 'title', e.target.value, section.id)} placeholder="e.g., Projects, Awards, Certifications" /></div>
            <div><Label htmlFor={`custom-description-${section.id}`}>Description</Label><Textarea id={`custom-description-${section.id}`} value={section.description || ''} onChange={(e) => handleChange('customSections', 'description', e.target.value, section.id)} className="min-h-[100px]" placeholder="Use bullet points if applicable (e.g., - Project X: description...)"/></div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => removeFromArraySection('customSections', section.id)} className="mt-2 text-destructive hover:text-destructive-foreground hover:bg-destructive">
            <Trash2 className="mr-1 h-3 w-3" /> Remove Section
          </Button>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={() => addToArraySection('customSections')}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Section
      </Button>
    </div>
  );


  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Resume Content</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['personal-info', 'summary']} className="w-full space-y-3">
          <AccordionItem value="personal-info" className="border rounded-md shadow-sm">
            <AccordionTrigger className="text-md font-semibold px-4 py-3 hover:bg-muted/50 rounded-t-md">Personal Information</AccordionTrigger>
            <AccordionContent className="p-4 border-t">{renderPersonalInfo()}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="summary" className="border rounded-md shadow-sm">
            <AccordionTrigger className="text-md font-semibold px-4 py-3 hover:bg-muted/50 rounded-t-md">Summary/Objective</AccordionTrigger>
            <AccordionContent className="p-4 border-t">{renderSummary()}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="experience" className="border rounded-md shadow-sm">
            <AccordionTrigger className="text-md font-semibold px-4 py-3 hover:bg-muted/50 rounded-t-md">Work Experience</AccordionTrigger>
            <AccordionContent className="p-4 border-t">{renderExperience()}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="education" className="border rounded-md shadow-sm">
            <AccordionTrigger className="text-md font-semibold px-4 py-3 hover:bg-muted/50 rounded-t-md">Education</AccordionTrigger>
            <AccordionContent className="p-4 border-t">{renderEducation()}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="skills" className="border rounded-md shadow-sm">
            <AccordionTrigger className="text-md font-semibold px-4 py-3 hover:bg-muted/50 rounded-t-md">Skills</AccordionTrigger>
            <AccordionContent className="p-4 border-t">{renderSkills()}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="custom-sections" className="border rounded-md shadow-sm">
            <AccordionTrigger className="text-md font-semibold px-4 py-3 hover:bg-muted/50 rounded-t-md">Custom Sections</AccordionTrigger>
            <AccordionContent className="p-4 border-t">{renderCustomSections()}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
