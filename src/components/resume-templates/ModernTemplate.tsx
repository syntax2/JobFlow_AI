
"use client";

import type { ResumeData } from '@/lib/context/types';
import { Mail, Phone, Linkedin, Globe, MapPin, Briefcase, GraduationCap, Star, Settings, CircleUserRound } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export function ModernTemplate({ data }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, customSections } = data;

  const renderBulletPoints = (text?: string) => {
    if (!text || text.trim() === '') return null;
    // Basic Markdown-like list parsing for bullet points starting with '*' or '-'
    const points = text.split('\n').filter(line => line.trim().startsWith('* ') || line.trim().startsWith('- '));
    if (points.length === 0) {
      // If no markdown bullets, treat each line as a paragraph or simple text
      return <p className="whitespace-pre-line">{text}</p>;
    }
    return (
      <ul className="list-disc pl-4 space-y-1">
        {points.map((point, index) => (
          <li key={index}>{point.substring(2).trim()}</li>
        ))}
      </ul>
    );
  };

  const SectionIcon = ({ icon: Icon }: { icon: React.ElementType }) => (
    <Icon className="w-5 h-5 text-primary mr-2" />
  );

  return (
    <div className="font-sans text-[10pt] text-gray-700 bg-white leading-relaxed">
      <div className="flex min-h-[297mm]"> {/* Ensure it fills A4 height */}
        {/* Left Column (Sidebar) */}
        <div className="w-[210px] bg-slate-50 p-5 space-y-6 border-r border-slate-200">
          {personalInfo?.photoUrl ? (
             <img 
                src={personalInfo.photoUrl} 
                alt={personalInfo.fullName || "User"} 
                className="w-32 h-32 rounded-full mx-auto object-cover mb-3 shadow-lg border-2 border-white"
                data-ai-hint="person portrait"
             />
          ) : (
            <div className="w-32 h-32 rounded-full mx-auto bg-slate-200 flex items-center justify-center mb-3 shadow-lg border-2 border-white">
              <CircleUserRound className="w-16 h-16 text-slate-400" />
            </div>
          )}
          {personalInfo && (
            <div className="text-center break-words">
              {personalInfo.fullName && <h1 className="text-xl font-bold text-primary">{personalInfo.fullName}</h1>}
              {personalInfo.jobTitle && <p className="text-sm text-slate-600 mt-0.5">{personalInfo.jobTitle}</p>}
            </div>
          )}
          
          {(personalInfo?.email || personalInfo?.phone || personalInfo?.linkedin || personalInfo?.portfolio || personalInfo?.address) && (
            <div className="space-y-1.5 pt-3 border-t border-slate-200">
              <h2 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">Contact</h2>
              {personalInfo.email && <p className="flex items-start text-xs break-all"><Mail className="w-3 h-3 mr-2 mt-0.5 text-slate-500 shrink-0" /> {personalInfo.email}</p>}
              {personalInfo.phone && <p className="flex items-start text-xs"><Phone className="w-3 h-3 mr-2 mt-0.5 text-slate-500 shrink-0" /> {personalInfo.phone}</p>}
              {personalInfo.linkedin && <p className="flex items-start text-xs break-all"><Linkedin className="w-3 h-3 mr-2 mt-0.5 text-slate-500 shrink-0" /> <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{personalInfo.linkedin.replace('https://www.linkedin.com/in/','').replace('https://','')}</a></p>}
              {personalInfo.portfolio && <p className="flex items-start text-xs break-all"><Globe className="w-3 h-3 mr-2 mt-0.5 text-slate-500 shrink-0" /> <a href={personalInfo.portfolio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{personalInfo.portfolio.replace('https://','').replace('http://','')}</a></p>}
              {personalInfo.address && <p className="flex items-start text-xs"><MapPin className="w-3 h-3 mr-2 mt-0.5 text-slate-500 shrink-0" /> {personalInfo.address}</p>}
            </div>
          )}

          {skills && skills.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <h2 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">Skills</h2>
              <ul className="space-y-1 text-xs">
                {skills.map(skill => skill.name && (
                  <li key={skill.id} className="flex items-center">
                    <Star className="w-3 h-3 mr-1.5 text-amber-400 shrink-0" /> 
                    {skill.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* You can add more sections to the sidebar here, e.g., languages, custom small sections */}
        </div>

        {/* Right Column (Main Content) */}
        <div className="w-full p-6 space-y-5">
          {summary && (
            <section>
              <div className="flex items-center mb-2">
                <SectionIcon icon={Briefcase} />
                <h2 className="text-base font-semibold text-gray-700 uppercase tracking-wider">Summary</h2>
              </div>
              <div className="pl-7 text-xs leading-relaxed border-l-2 border-primary/20 ml-[9px]">
                <p className="whitespace-pre-line">{summary}</p>
              </div>
            </section>
          )}

          {experience && experience.length > 0 && (
            <section>
              <div className="flex items-center mb-3">
                <SectionIcon icon={Briefcase} />
                <h2 className="text-base font-semibold text-gray-700 uppercase tracking-wider">Experience</h2>
              </div>
              <div className="space-y-3.5 pl-7 border-l-2 border-primary/20 ml-[9px]">
                {experience.map(exp => exp.jobTitle && (
                  <div key={exp.id} className="text-xs relative before:content-[''] before:absolute before:-left-[23px] before:top-1.5 before:w-2.5 before:h-2.5 before:bg-primary before:rounded-full before:border-2 before:border-white dark:before:border-slate-50">
                    <h3 className="font-semibold text-sm text-gray-800">{exp.jobTitle}</h3>
                    <div className="flex justify-between items-baseline text-gray-500 text-[9pt] mb-0.5">
                      <p className="italic">{exp.company}{exp.location && `, ${exp.location}`}</p>
                      <p>{(exp.startDate || '')} - {(exp.endDate || 'Present')}</p>
                    </div>
                    <div className="prose prose-xs max-w-none">
                      {exp.description && renderBulletPoints(exp.description)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {education && education.length > 0 && (
            <section>
              <div className="flex items-center mb-3">
                 <SectionIcon icon={GraduationCap} />
                <h2 className="text-base font-semibold text-gray-700 uppercase tracking-wider">Education</h2>
              </div>
              <div className="space-y-3 pl-7 border-l-2 border-primary/20 ml-[9px]">
                {education.map(edu => edu.degree && (
                  <div key={edu.id} className="text-xs relative before:content-[''] before:absolute before:-left-[23px] before:top-1.5 before:w-2.5 before:h-2.5 before:bg-primary before:rounded-full before:border-2 before:border-white dark:before:border-slate-50">
                    <h3 className="font-semibold text-sm text-gray-800">{edu.degree}</h3>
                    <div className="flex justify-between items-baseline text-gray-500 text-[9pt] mb-0.5">
                      <p className="italic">{edu.institution}{edu.location && `, ${edu.location}`}</p>
                      <p>{edu.graduationYear}</p>
                    </div>
                    {edu.description && <p className="mt-0.5 text-gray-600 prose prose-xs max-w-none whitespace-pre-line">{edu.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {customSections && customSections.length > 0 && customSections.map(section => section.title && (
            <section key={section.id}>
              <div className="flex items-center mb-3">
                <SectionIcon icon={Settings} /> {/* Generic icon, could be dynamic */}
                <h2 className="text-base font-semibold text-gray-700 uppercase tracking-wider">{section.title}</h2>
              </div>
              <div className="text-xs leading-relaxed pl-7 border-l-2 border-primary/20 ml-[9px] prose prose-xs max-w-none relative before:content-[''] before:absolute before:-left-[23px] before:top-1.5 before:w-2.5 before:h-2.5 before:bg-primary before:rounded-full before:border-2 before:border-white dark:before:border-slate-50">
                {section.description && renderBulletPoints(section.description)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

