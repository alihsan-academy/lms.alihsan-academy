"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Check, Search, User } from 'lucide-react';

export interface StudentOption {
  id: string;
  name: string;
  registration_number?: string | null;
  profile_photo?: string | null;
  enrolment_status?: string | null;
  class_name?: string | null;
}

interface StudentSelectDropdownProps {
  students: StudentOption[];
  selectedStudentId: string;
  onSelect: (studentId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function StudentSelectDropdown({
  students,
  selectedStudentId,
  onSelect,
  disabled = false,
  className = "",
}: StudentSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && students.length > 4) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, students.length]);

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      (s.registration_number && s.registration_number.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  const getStatusColor = (status?: string | null) => {
    if (status === 'break') return 'bg-amber-400';
    if (status === 'stopped') return 'bg-rose-500';
    return 'bg-emerald-500';
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || students.length === 0}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[40px] px-3 py-2 bg-white hover:bg-slate-50/70 border rounded-xl flex items-center justify-between gap-2.5 transition-all text-left shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          isOpen
            ? 'border-primary ring-2 ring-primary/10'
            : 'border-border/80 hover:border-slate-300'
        } ${disabled || students.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {currentStudent ? (
            <>
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 overflow-hidden border border-primary/20">
                {currentStudent.profile_photo ? (
                  <img
                    src={currentStudent.profile_photo}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{currentStudent.name?.charAt(0)?.toUpperCase() || 'S'}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {currentStudent.name}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                  #{currentStudent.registration_number || 'N/A'}
                </span>
              </div>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(
                  currentStudent.enrolment_status
                )}`}
                title={`Status: ${currentStudent.enrolment_status || 'ongoing'}`}
              />
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <User className="h-4 w-4" />
              <span>{students.length === 0 ? 'No students assigned' : 'Select a student'}</span>
            </div>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-border/80 rounded-xl shadow-lg shadow-black/[0.07] p-1.5 overflow-hidden"
            role="listbox"
          >
            {/* Search Input when > 4 students */}
            {students.length > 4 && (
              <div className="relative mb-1 px-0.5">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Filter student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-2.5 text-xs bg-muted/40 border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
                />
              </div>
            )}

            {/* Students List */}
            <div className="max-h-60 overflow-y-auto space-y-0.5 overscroll-contain">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => {
                  const isSelected = s.id === selectedStudentId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSelect(s.id);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'hover:bg-muted/60 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 overflow-hidden border border-primary/20">
                          {s.profile_photo ? (
                            <img src={s.profile_photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{s.name?.charAt(0)?.toUpperCase() || 'S'}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate font-medium">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            #{s.registration_number || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${getStatusColor(s.enrolment_status)}`}
                          title={`Status: ${s.enrolment_status || 'ongoing'}`}
                        />
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No matching students
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
