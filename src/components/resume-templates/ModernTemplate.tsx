
"use client";

import type { ResumeData } from '@/lib/context/types';
import { Mail, Phone, Linkedin, Globe, MapPin } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export function ModernTemplate({ data }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, customSections } = data;

  const renderBulletPoints = (text?: string) => {
    if (!text) return null;
    return (
      <ul className="list-disc pl-4 space-y-1">
        {text.split('\n').map((point, index) => point.trim() && <li key={index}>{point.trim()}</li>)}
      </ul>
    );
  };

  return (
    <div className="font-sans text-sm text-gray-800 bg-white">
      <div className="flex">
        {/* Left Column (Sidebar) */}
        <div className="w-1/3 bg-gray-100 p-6 space-y-6">
          {personalInfo?.photoUrl && (
             <img 
                src={personalInfo.photoUrl} 
                alt={personalInfo.fullName || "User"} 
                className="w-32 h-32 rounded-full mx-auto object-cover mb-4 shadow-md"
                data-ai-hint="person portrait"
             />
          )}
          {personalInfo && (
            <div className="text-center">
              {personalInfo.fullName && <h1 className="text-2xl font-bold text-primary">{personalInfo.fullName}</h1>}
              {personalInfo.jobTitle && <p className="text-md text-gray-600">{personalInfo.jobTitle}</p>}
            </div>
          )}
          
          {(personalInfo?.email || personalInfo?.phone || personalInfo?.linkedin || personalInfo?.portfolio || personalInfo?.address) && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase text-gray-500 border-b pb-1">Contact</h2>
              {personalInfo.email && <p className="flex items-center text-xs"><Mail className="w-3 h-3 mr-2 text-primary" /> {personalInfo.email}</p>}
              {personalInfo.phone && <p className="flex items-center text-xs"><Phone className="w-3 h-3 mr-2 text-primary" /> {personalInfo.phone}</p>}
              {personalInfo.linkedin && <p className="flex items-center text-xs truncate"><Linkedin className="w-3 h-3 mr-2 text-primary" /> <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">{personalInfo.linkedin.replace('https://www.linkedin.com/in/','')}</a></p>}
              {personalInfo.portfolio && <p className="flex items-center text-xs truncate"><Globe className="w-3 h-3 mr-2 text-primary" /> <a href={personalInfo.portfolio} target="_blank" rel="noopener noreferrer" className="hover:underline">{personalInfo.portfolio.replace('https://','').replace('http://','')}</a></p>}
              {personalInfo.address && <p className="flex items-center text-xs"><MapPin className="w-3 h-3 mr-2 text-primary" /> {personalInfo.address}</p>}
            </div>
          )}

          {skills && skills.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase text-gray-500 border-b pb-1">Skills</h2>
              <ul className="list-disc pl-4 text-xs space-y-1">
                {skills.map(skill => skill.name && <li key={skill.id}>{skill.name}</li>)}
              </ul>
            </div>
          )}
          {/* You can add more sections to the sidebar here, e.g., languages, custom small sections */}
        </div>

        {/* Right Column (Main Content) */}
        <div className="w-2/3 p-6 pl-8 space-y-6">
          {summary && (
            <section>
              <h2 className="text-lg font-semibold text-primary border-b-2 border-primary pb-1 mb-2">Summary</h2>
              <p className="text-xs leading-relaxed">{summary}</p>
            </section>
          )}

          {experience && experience.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-primary border-b-2 border-primary pb-1 mb-3">Experience</h2>
              <div className="space-y-4">
                {experience.map(exp => exp.jobTitle && (
                  <div key={exp.id} className="text-xs">
                    <h3 className="font-semibold text-sm">{exp.jobTitle}</h3>
                    <div className="flex justify-between items-center text-gray-600">
                      <p className="italic">{exp.company}{exp.location && `, ${exp.location}`}</p>
                      <p className="text-xs">{(exp.startDate || '')} - {(exp.endDate || 'Present')}</p>
                    </div>
                    {exp.description && renderBulletPoints(exp.description)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {education && education.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-primary border-b-2 border-primary pb-1 mb-3">Education</h2>
              <div className="space-y-3">
                {education.map(edu => edu.degree && (
                  <div key={edu.id} className="text-xs">
                    <h3 className="font-semibold text-sm">{edu.degree}</h3>
                    <div className="flex justify-between items-center text-gray-600">
                      <p className="italic">{edu.institution}{edu.location && `, ${edu.location}`}</p>
                      <p className="text-xs">{edu.graduationYear}</p>
                    </div>
                    {edu.description && <p className="mt-1 text-gray-700 text-xs">{edu.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {customSections && customSections.length > 0 && customSections.map(section => section.title && (
            <section key={section.id}>
              <h2 className="text-lg font-semibold text-primary border-b-2 border-primary pb-1 mb-3">{section.title}</h2>
              <div className="text-xs leading-relaxed">
                {section.description && renderBulletPoints(section.description)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
