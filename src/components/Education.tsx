import { useState } from 'react';
import {
  BookOpen, ChevronRight, ChevronDown, Award, AlertTriangle,
  Lightbulb, GraduationCap, BookMarked, ArrowLeft, CheckCircle2,
} from 'lucide-react';
import { LESSONS, Lesson } from '../lib/education';

export default function EducationView() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (selectedLesson) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#131722] flex items-center space-x-3 shrink-0">
          <button
            onClick={() => { setSelectedLesson(null); setQuizAnswers({}); }}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </button>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              {selectedLesson.level} · Lesson {LESSONS.indexOf(selectedLesson) + 1} of {LESSONS.length}
            </span>
            <h2 className="text-lg font-bold text-white">{selectedLesson.title}</h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Subtitle */}
          <p className="text-slate-400 text-sm italic border-l-2 border-blue-500 pl-3">
            {selectedLesson.subtitle}
          </p>

          {/* Sections */}
          {selectedLesson.sections.map((section, idx) => {
            const sectionId = `${selectedLesson.id}-${idx}`;
            const isExpanded = expandedSections.has(sectionId);
            return (
              <div
                key={sectionId}
                className="bg-[#1e222d] border border-slate-700 rounded-lg overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleSection(sectionId)}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors text-left"
                >
                  <h3 className="text-sm font-semibold text-blue-400">{section.heading}</h3>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400 transition-transform" /> : <ChevronRight className="w-4 h-4 text-slate-400 transition-transform" />}
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 animate-fadeIn">
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{section.body}</p>
                    
                    {section.example && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Example</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{section.example}</p>
                      </div>
                    )}

                    {section.tip && (
                      <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          <Award className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Pro Tip</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{section.tip}</p>
                      </div>
                    )}

                    {section.warning && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Warning</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{section.warning}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Quiz Section */}
          {selectedLesson.quiz && selectedLesson.quiz.length > 0 && (
            <div className="mt-6 bg-[#1e222d] border border-slate-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-purple-400">Knowledge Check</h3>
              </div>
              
              {selectedLesson.quiz.map((q, qIdx) => {
                const answered = quizAnswers[`${selectedLesson.id}-${qIdx}`] !== undefined;
                const isCorrect = quizAnswers[`${selectedLesson.id}-${qIdx}`] === q.correctIndex;
                
                return (
                  <div key={qIdx} className="mb-4 last:mb-0">
                    <p className="text-xs text-slate-200 font-medium mb-2">{q.question}</p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oIdx) => {
                        const selected = quizAnswers[`${selectedLesson.id}-${qIdx}`] === oIdx;
                        let bg = 'bg-slate-800 hover:bg-slate-700';
                        if (answered && oIdx === q.correctIndex) bg = 'bg-green-500/20 border-green-500/30';
                        else if (selected && oIdx !== q.correctIndex) bg = 'bg-red-500/20 border-red-500/30';
                        else if (selected) bg = 'bg-blue-500/20 border-blue-500/30';

                        return (
                          <button
                            key={oIdx}
                            onClick={() => {
                              if (!answered) {
                                setQuizAnswers(prev => ({ ...prev, [`${selectedLesson.id}-${qIdx}`]: oIdx }));
                              }
                            }}
                            className={`w-full text-left text-xs px-3 py-2 rounded border border-slate-700 transition-colors ${bg}`}
                            disabled={answered}
                          >
                            <span className="text-slate-400 mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                            {opt}
                            {answered && oIdx === q.correctIndex && <CheckCircle2 className="w-3 h-3 text-green-400 inline ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                    {answered && (
                      <p className="text-xs text-slate-500 mt-1.5 italic transition-all">
                        {isCorrect ? 'Correct! ' : ''}
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Key Takeaway */}
          <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center space-x-1.5 mb-1.5">
              <BookMarked className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase">Key Takeaway</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedLesson.keyTakeaway}</p>
          </div>
        </div>
      </div>
    );
  }

  // Lesson List View
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-[#131722] shrink-0">
        <div className="flex items-center space-x-2 mb-1">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Darvas Box Academy</h2>
        </div>
        <p className="text-xs text-slate-500">
          {LESSONS.length} lessons · {LESSONS.reduce((s, l) => s + l.sections.length, 0)} topics · {LESSONS.reduce((s, l) => s + (l.quiz?.length || 0), 0)} quiz questions
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {LESSONS.map((lesson, idx) => {
          const levelColors: Record<string, string> = {
            beginner: 'bg-green-500/10 text-green-400 border-green-500/30',
            intermediate: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
            advanced: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
            expert: 'bg-red-500/10 text-red-400 border-red-500/30',
          };
          
          return (
            <button
              key={lesson.id}
              onClick={() => setSelectedLesson(lesson)}
              className="w-full text-left bg-[#1e222d] border border-slate-700 rounded-lg p-3 hover:border-blue-500/50 transition-all group"
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{lesson.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                      {lesson.title}
                    </h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold ${levelColors[lesson.level]}`}>
                      {lesson.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{lesson.subtitle}</p>
                  <div className="flex items-center space-x-3 mt-2 text-[10px] text-slate-500">
                    <span>{lesson.sections.length} topics</span>
                    {lesson.quiz && <span>{lesson.quiz.length} questions</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 mt-1 group-hover:text-blue-400 transition-colors shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
