
"use client";

import type { ResumeData } from '@/lib/context/types';
import { Mail, Phone, Linkedin, Globe, MapPin } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export function ClassicTemplate({ data }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, customSections } = data;

  const renderBulletPoints = (text?: string) => {
    if (!text || text.trim() === '') return null;
    const points = text.split('\n').filter(line => line.trim().startsWith('* ') || line.trim().startsWith('- '));
    if (points.length === 0) {
      return <p className="whitespace-pre-line">{text}</p>;
    }
    return (
      <ul className="list-disc pl-6 space-y-0.5 text-gray-700">
        {points.map((point, index) => (
          <li key={index} className="leading-snug">{point.substring(2).trim()}</li>
        ))}
      </ul>
    );
  };
  
  const sectionTitleClass = "text-lg font-bold text-gray-700 border-b-2 border-gray-300 pb-1.5 mb-2.5 uppercase tracking-wider";

  return (
    <div className="font-serif text-[10.5pt] text-gray-800 bg-white p-6 leading-normal">
      {/* Header */}
      {personalInfo && (
        <header className="text-center mb-5">
          {personalInfo.fullName && <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">{personalInfo.fullName}</h1>}
          {personalInfo.jobTitle && <p className="text-md text-gray-600 mt-1">{personalInfo.jobTitle}</p>}
          <div className="flex justify-center items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-[9.5pt] text-gray-500">
            {personalInfo.phone && <span className="inline-flex items-center"><Phone className="inline w-3 h-3 mr-1.5" />{personalInfo.phone}</span>}
            {personalInfo.email && <span className="inline-flex items-center"><Mail className="inline w-3 h-3 mr-1.5" /><a href={`mailto:${personalInfo.email}`} className="hover:text-primary hover:underline">{personalInfo.email}</a></span>}
            {personalInfo.linkedin && <span className="inline-flex items-center"><Linkedin className="inline w-3 h-3 mr-1.5" /><a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">{personalInfo.linkedin.replace('https://www.linkedin.com/in/','').replace('https://','')}</a></span>}
            {personalInfo.portfolio && <span className="inline-flex items-center"><Globe className="inline w-3 h-3 mr-1.5" /><a href={personalInfo.portfolio} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">{personalInfo.portfolio.replace('https://','').replace('http://','')}</a></span>}
            {personalInfo.address && <span className="inline-flex items-center"><MapPin className="inline w-3 h-3 mr-1.5" />{personalInfo.address}</span>}
          </div>
        </header>
      )}

      {/* Summary */}
      {summary && (
        <section className="mb-5">
          <h2 className={sectionTitleClass}>Summary</h2>
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="mb-5">
          <h2 className={sectionTitleClass}>Experience</h2>
          <div className="space-y-3">
            {experience.map(exp => exp.jobTitle && (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="text-md font-semibold text-gray-800">{exp.jobTitle}</h3>
                  <span className="text-[9.5pt] text-gray-500 whitespace-nowrap">{(exp.startDate || '')} - {(exp.endDate || 'Present')}</span>
                </div>
                <p className="text-[10pt] italic text-gray-600 mb-1">{exp.company}{exp.location && `, ${exp.location}`}</p>
                {exp.description && renderBulletPoints(exp.description)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="mb-5">
          <h2 className={sectionTitleClass}>Education</h2>
          <div className="space-y-2.5">
            {education.map(edu => edu.degree && (
              <div key={edu.id}>
                 <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-md font-semibold text-gray-800">{edu.degree}</h3>
                    <span className="text-[9.5pt] text-gray-500 whitespace-nowrap">{edu.graduationYear}</span>
                </div>
                <p className="text-[10pt] italic text-gray-600">{edu.institution}{edu.location && `, ${edu.location}`}</p>
                {edu.description && <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-line">{edu.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className="mb-5">
          <h2 className={sectionTitleClass}>Skills</h2>
          <div className="flex flex-wrap gap-x-2 gap-y-1.5">
            {skills.map((skill, index) => skill.name && (
              <React.Fragment key={skill.id}>
                <span className="text-sm text-gray-700">{skill.name}</span>
                {index < skills.length - 1 && <span className="text-gray-400">&bull;</span>}
              </React.Fragment>
            ))}
          </div>
        </section>
      )}
      
      {/* Custom Sections */}
      {customSections && customSections.length > 0 && customSections.map(section => section.title && (
        <section key={section.id} className="mb-5">
          <h2 className={sectionTitleClass}>{section.title}</h2>
          <div className="text-sm leading-relaxed text-gray-700">
             {section.description && renderBulletPoints(section.description)}
          </div>
        </section>
      ))}
    </div>
  );
}

