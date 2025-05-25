
"use client";

import type { ResumeData } from '@/lib/context/types';
import { Mail, Phone, Linkedin, Globe, MapPin } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export function ClassicTemplate({ data }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, customSections } = data;

  const renderBulletPoints = (text?: string) => {
    if (!text) return null;
    return (
      <ul className="list-disc pl-5 space-y-1 text-sm">
        {text.split('\n').map((point, index) => point.trim() && <li key={index}>{point.trim()}</li>)}
      </ul>
    );
  };

  return (
    <div className="font-serif text-gray-800 bg-white p-4">
      {/* Header */}
      {personalInfo && (
        <header className="text-center mb-6 border-b pb-4">
          {personalInfo.fullName && <h1 className="text-3xl font-bold text-gray-900">{personalInfo.fullName}</h1>}
          {personalInfo.jobTitle && <p className="text-lg text-gray-700 mt-1">{personalInfo.jobTitle}</p>}
          <div className="flex justify-center items-center space-x-4 mt-2 text-xs text-gray-600">
            {personalInfo.phone && <span><Phone className="inline w-3 h-3 mr-1" />{personalInfo.phone}</span>}
            {personalInfo.email && <span><Mail className="inline w-3 h-3 mr-1" />{personalInfo.email}</span>}
            {personalInfo.linkedin && <span><Linkedin className="inline w-3 h-3 mr-1" /><a href={personalInfo.linkedin} className="hover:underline">{personalInfo.linkedin.replace('https://www.linkedin.com/in/','')}</a></span>}
            {personalInfo.portfolio && <span><Globe className="inline w-3 h-3 mr-1" /><a href={personalInfo.portfolio} className="hover:underline">{personalInfo.portfolio.replace('https://','').replace('http://','')}</a></span>}
            {personalInfo.address && <span><MapPin className="inline w-3 h-3 mr-1" />{personalInfo.address}</span>}
          </div>
        </header>
      )}

      {/* Summary */}
      {summary && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-gray-300 pb-1 mb-2">Summary</h2>
          <p className="text-sm leading-relaxed">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-gray-300 pb-1 mb-3">Experience</h2>
          <div className="space-y-4">
            {experience.map(exp => exp.jobTitle && (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-lg font-medium">{exp.jobTitle}</h3>
                  <span className="text-xs text-gray-600">{(exp.startDate || '')} - {(exp.endDate || 'Present')}</span>
                </div>
                <p className="text-md italic text-gray-700">{exp.company}{exp.location && `, ${exp.location}`}</p>
                {exp.description && renderBulletPoints(exp.description)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-gray-300 pb-1 mb-3">Education</h2>
          <div className="space-y-3">
            {education.map(edu => edu.degree && (
              <div key={edu.id}>
                 <div className="flex justify-between items-baseline">
                    <h3 className="text-lg font-medium">{edu.degree}</h3>
                    <span className="text-xs text-gray-600">{edu.graduationYear}</span>
                </div>
                <p className="text-md italic text-gray-700">{edu.institution}{edu.location && `, ${edu.location}`}</p>
                {edu.description && <p className="text-sm text-gray-600 mt-1">{edu.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-gray-300 pb-1 mb-2">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => skill.name && (
              <span key={skill.id} className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">{skill.name}</span>
            ))}
          </div>
        </section>
      )}
      
      {/* Custom Sections */}
      {customSections && customSections.length > 0 && customSections.map(section => section.title && (
        <section key={section.id} className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-gray-300 pb-1 mb-2">{section.title}</h2>
          <div className="text-sm leading-relaxed">
             {section.description && renderBulletPoints(section.description)}
          </div>
        </section>
      ))}
    </div>
  );
}
