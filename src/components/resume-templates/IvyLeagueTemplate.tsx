
"use client";

import type { ResumeData } from '@/lib/context/types';

interface TemplateProps {
  data: ResumeData;
}

export function IvyLeagueTemplate({ data }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, customSections } = data;

  const renderBulletPoints = (text?: string) => {
    if (!text || text.trim() === '') return null;
    const points = text.split('\n').filter(line => line.trim().startsWith('* ') || line.trim().startsWith('- '));
    if (points.length === 0) {
      return <p className="whitespace-pre-line">{text}</p>;
    }
    return (
      <ul className="list-disc pl-5 space-y-0.5">
        {points.map((point, index) => (
          <li key={index} className="mb-0.5">{point.substring(2).trim()}</li>
        ))}
      </ul>
    );
  };

  const sectionTitleClass = "text-[10.5pt] font-bold uppercase tracking-wider mb-0.5 text-gray-700";
  const hrClass = "my-1.5 border-t border-gray-400";

  return (
    <div className="font-serif text-[10pt] text-gray-800 bg-white p-5 leading-snug">
      {/* Header */}
      {personalInfo && (
        <header className="text-center mb-3">
          {personalInfo.fullName && <h1 className="text-2xl font-bold tracking-wider uppercase text-gray-900">{personalInfo.fullName}</h1>}
          <div className="flex justify-center items-center flex-wrap gap-x-2.5 gap-y-0.5 mt-1 text-[9pt] text-gray-600">
            {personalInfo.address && <span>{personalInfo.address}</span>}
            {personalInfo.address && (personalInfo.phone || personalInfo.email) && <span className="text-gray-400">&bull;</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {(personalInfo.phone && personalInfo.email) && <span className="text-gray-400">&bull;</span>}
            {personalInfo.email && <a href={`mailto:${personalInfo.email}`} className="hover:text-primary hover:underline">{personalInfo.email}</a>}
            {((personalInfo.email || personalInfo.phone || personalInfo.address) && (personalInfo.linkedin || personalInfo.portfolio)) && <span className="text-gray-400">&bull;</span>}
            {personalInfo.linkedin && <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">LinkedIn</a>}
            {personalInfo.linkedin && personalInfo.portfolio && <span className="text-gray-400">&bull;</span>}
            {personalInfo.portfolio && <a href={personalInfo.portfolio} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">Portfolio</a>}
          </div>
        </header>
      )}
      <hr className={hrClass} />

      {/* Education - Often prioritized */}
      {education && education.length > 0 && (
        <section className="mb-2.5">
          <h2 className={sectionTitleClass}>Education</h2>
          <hr className="border-t border-gray-300 mb-1.5" />
          {education.map(edu => edu.degree && (
            <div key={edu.id} className="mb-1">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-gray-800">{edu.institution}</span>
                <span className="text-gray-600 text-right min-w-[80px] whitespace-nowrap">{edu.location}</span>
              </div>
              <div className="flex justify-between items-start italic text-gray-700">
                <span>{edu.degree}</span>
                <span className="text-gray-600 text-right min-w-[80px] whitespace-nowrap">{edu.graduationYear}</span>
              </div>
              {edu.description && <p className="text-[9.5pt] text-gray-600 mt-0.5 whitespace-pre-line">{edu.description}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="mb-2.5">
          <h2 className={sectionTitleClass}>Experience</h2>
          <hr className="border-t border-gray-300 mb-1.5" />
          {experience.map(exp => exp.jobTitle && (
            <div key={exp.id} className="mb-1.5">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-gray-800">{exp.company}</span>
                <span className="text-gray-600 text-right min-w-[80px] whitespace-nowrap">{exp.location}</span>
              </div>
              <div className="flex justify-between items-start italic text-gray-700">
                <span>{exp.jobTitle}</span>
                <span className="text-gray-600 text-right min-w-[80px] whitespace-nowrap">{(exp.startDate || '')} - {(exp.endDate || 'Present')}</span>
              </div>
              {exp.description && renderBulletPoints(exp.description)}
            </div>
          ))}
        </section>
      )}
      
      {/* Skills - Concise list or categorized */}
      {skills && skills.length > 0 && (
        <section className="mb-2.5">
          <h2 className={sectionTitleClass}>Skills</h2>
          <hr className="border-t border-gray-300 mb-1.5" />
          <p className="text-gray-700 leading-snug">
            {skills.map(skill => skill.name).join('; ')}.
          </p>
          {/* Alternative for categorized skills:
            <div className="grid grid-cols-2 gap-x-4">
              <div><span className="font-semibold">Programming:</span> JavaScript, Python, Java</div>
              <div><span className="font-semibold">Tools:</span> Git, Docker, AWS</div>
            </div>
          */}
        </section>
      )}

      {/* Custom Sections (e.g., Projects, Publications, Awards) */}
      {customSections && customSections.length > 0 && customSections.map(section => section.title && (
        <section key={section.id} className="mb-2.5">
          <h2 className={sectionTitleClass}>{section.title}</h2>
          <hr className="border-t border-gray-300 mb-1.5" />
          <div className="leading-snug">
            {section.description && renderBulletPoints(section.description)}
          </div>
        </section>
      ))}

      {/* Professional Summary - Optional */}
      {summary && (
        <section className="mt-2 pt-2 border-t border-gray-300">
           <h2 className={sectionTitleClass}>Professional Summary</h2>
           <hr className="border-t border-gray-300 mb-1.5" />
          <p className="leading-relaxed text-gray-700 whitespace-pre-line">{summary}</p>
        </section>
      )}
    </div>
  );
}
