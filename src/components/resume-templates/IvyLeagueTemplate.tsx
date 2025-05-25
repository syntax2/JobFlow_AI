
"use client";

import type { ResumeData } from '@/lib/context/types';
import { Mail, Phone, Linkedin, Globe, MapPin } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export function IvyLeagueTemplate({ data }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, customSections } = data;

  const renderBulletPoints = (text?: string) => {
    if (!text) return null;
    return (
      <ul className="list-disc pl-6 space-y-1 text-gray-700 text-[10pt] leading-snug">
        {text.split('\n').map((point, index) => point.trim() && <li key={index} className="mb-0.5">{point.trim()}</li>)}
      </ul>
    );
  };

  return (
    <div className="font-serif text-[11pt] text-gray-900 bg-white p-4 leading-normal">
      {/* Header */}
      {personalInfo && (
        <header className="text-center mb-4">
          {personalInfo.fullName && <h1 className="text-2xl font-bold tracking-wider uppercase">{personalInfo.fullName}</h1>}
          <div className="flex justify-center items-center space-x-3 mt-1 text-[9pt] text-gray-600">
            {personalInfo.address && <span>{personalInfo.address}</span>}
            {personalInfo.address && (personalInfo.phone || personalInfo.email) && <span>&bull;</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {(personalInfo.phone && personalInfo.email) && <span>&bull;</span>}
            {personalInfo.email && <a href={`mailto:${personalInfo.email}`} className="hover:underline">{personalInfo.email}</a>}
            {((personalInfo.email || personalInfo.phone || personalInfo.address) && (personalInfo.linkedin || personalInfo.portfolio)) && <span>&bull;</span>}
            {personalInfo.linkedin && <a href={personalInfo.linkedin} className="hover:underline">LinkedIn</a>}
            {personalInfo.linkedin && personalInfo.portfolio && <span>&bull;</span>}
            {personalInfo.portfolio && <a href={personalInfo.portfolio} className="hover:underline">Portfolio</a>}
          </div>
        </header>
      )}
      <hr className="my-3 border-gray-400" />

      {/* Education - Often prioritized in Ivy League style */}
      {education && education.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[11pt] font-bold uppercase tracking-wider mb-1">Education</h2>
          <hr className="mb-1.5 border-gray-400" />
          {education.map(edu => edu.degree && (
            <div key={edu.id} className="mb-1.5">
              <div className="flex justify-between items-start">
                <span className="font-semibold">{edu.institution}</span>
                <span className="text-gray-700 text-right min-w-[80px]">{edu.location}</span>
              </div>
              <div className="flex justify-between items-start italic">
                <span>{edu.degree}</span>
                <span className="text-gray-700 text-right min-w-[80px]">{edu.graduationYear}</span>
              </div>
              {edu.description && <p className="text-[10pt] text-gray-700 mt-0.5">{edu.description}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[11pt] font-bold uppercase tracking-wider mb-1">Experience</h2>
          <hr className="mb-1.5 border-gray-400" />
          {experience.map(exp => exp.jobTitle && (
            <div key={exp.id} className="mb-2">
              <div className="flex justify-between items-start">
                <span className="font-semibold">{exp.company}</span>
                <span className="text-gray-700 text-right min-w-[80px]">{exp.location}</span>
              </div>
              <div className="flex justify-between items-start italic">
                <span>{exp.jobTitle}</span>
                <span className="text-gray-700 text-right min-w-[80px]">{(exp.startDate || '')} - {(exp.endDate || 'Present')}</span>
              </div>
              {exp.description && renderBulletPoints(exp.description)}
            </div>
          ))}
        </section>
      )}
      
      {/* Skills - Often a concise list */}
      {skills && skills.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[11pt] font-bold uppercase tracking-wider mb-1">Skills</h2>
          <hr className="mb-1.5 border-gray-400" />
          <p className="text-[10pt] text-gray-700 leading-snug">
            {skills.map(skill => skill.name).join('; ')}
          </p>
        </section>
      )}

      {/* Custom Sections (e.g., Projects, Publications, Awards) */}
      {customSections && customSections.length > 0 && customSections.map(section => section.title && (
        <section key={section.id} className="mb-3">
          <h2 className="text-[11pt] font-bold uppercase tracking-wider mb-1">{section.title}</h2>
          <hr className="mb-1.5 border-gray-400" />
          <div className="text-[10pt] leading-snug">
            {section.description && renderBulletPoints(section.description)}
            {/* If description is not bullet points, render directly */}
            {/* {section.description && !section.description.includes('\n') && <p>{section.description}</p>} */}
          </div>
        </section>
      ))}

      {/* Professional Summary - Sometimes included, sometimes omitted depending on preference */}
      {summary && (
        <section className="mt-3 pt-2 border-t border-gray-300">
           <h2 className="text-[11pt] font-bold uppercase tracking-wider mb-1">Professional Summary</h2>
           <hr className="mb-1.5 border-gray-400" />
          <p className="text-[10pt] leading-relaxed text-gray-700">{summary}</p>
        </section>
      )}
    </div>
  );
}
