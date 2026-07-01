"use client";

import { X, User, ChevronDown } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SpeakerMetadata {
  speakerLabel: string;   // e.g. "Speaker 1"
  speakerName: string;
  age: string;
  gender: string;
  qualification: string;
  occupation: string;
  motherTongue: string;
  nativePlace: string;
  currentLocation: string;
  district: string;
  state: string;
  dialectZone: string;
  recordingDevice: string;
  recordingEnvironment: string;
}

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const QUALIFICATION_OPTIONS = ["No formal education", "Primary", "Secondary", "Higher Secondary", "Graduate", "Post Graduate", "Doctorate"];
const RECORDING_DEVICE_OPTIONS = ["Mobile", "PC", "Tablet", "Professional Mic"];
const RECORDING_ENV_OPTIONS = ["Indoor", "Outdoor", "Studio"];
const DIALECT_ZONES = ["Northern", "Southern", "Eastern", "Western", "Central", "Coastal"];

const DEFAULT_METADATA: SpeakerMetadata = {
  speakerLabel: "Speaker 1",
  speakerName: "",
  age: "",
  gender: "",
  qualification: "",
  occupation: "",
  motherTongue: "",
  nativePlace: "",
  currentLocation: "",
  district: "",
  state: "",
  dialectZone: "",
  recordingDevice: "",
  recordingEnvironment: "",
};

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  required?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, value, options, onChange, required }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-muted-foreground">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 pl-2 pr-7 text-xs border rounded-md bg-background appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">Select...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
    </div>
  </div>
);

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

const TextField: React.FC<TextFieldProps> = ({ label, value, onChange, placeholder, type = "text", required }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-muted-foreground">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || label}
      className="h-8 text-xs"
    />
  </div>
);

interface MetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  speakers: string[];
  onSave: (metadata: SpeakerMetadata[]) => void;
  existingMetadata?: SpeakerMetadata[];
}

export const MetadataModal: React.FC<MetadataModalProps> = ({
  isOpen,
  onClose,
  speakers,
  onSave,
  existingMetadata = [],
}) => {
  const [activeSpeaker, setActiveSpeaker] = useState(speakers[0] || "Speaker 1");
  const [metadataMap, setMetadataMap] = useState<Record<string, SpeakerMetadata>>(() => {
    const map: Record<string, SpeakerMetadata> = {};
    speakers.forEach(sp => {
      const existing = existingMetadata.find(m => m.speakerLabel === sp);
      map[sp] = existing || { ...DEFAULT_METADATA, speakerLabel: sp };
    });
    return map;
  });

  if (!isOpen) return null;

  const current = metadataMap[activeSpeaker] || { ...DEFAULT_METADATA, speakerLabel: activeSpeaker };

  const updateField = (field: keyof SpeakerMetadata, value: string) => {
    setMetadataMap(prev => ({
      ...prev,
      [activeSpeaker]: { ...prev[activeSpeaker], [field]: value }
    }));
  };

  const handleSave = () => {
    onSave(Object.values(metadataMap));
    onClose();
  };

  const isComplete = (sp: string) => {
    const m = metadataMap[sp];
    return m && m.speakerName && m.age && m.gender;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-background border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Speaker Metadata</h2>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Speaker Tabs */}
        <div className="flex gap-1 px-5 pt-3 border-b pb-0 overflow-x-auto">
          {speakers.map(sp => (
            <button
              key={sp}
              onClick={() => setActiveSpeaker(sp)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-colors whitespace-nowrap",
                activeSpeaker === sp
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {sp}
              {isComplete(sp) && <span className="ml-1 text-green-500">✓</span>}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Section: Personal Info */}
            <div className="col-span-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Personal Information</p>
            </div>
            <TextField label="Full Name" value={current.speakerName} onChange={v => updateField('speakerName', v)} placeholder="Speaker's full name" required />
            <TextField label="Age" value={current.age} onChange={v => updateField('age', v)} type="number" placeholder="e.g. 35" required />
            <SelectField label="Gender" value={current.gender} options={GENDER_OPTIONS} onChange={v => updateField('gender', v)} required />
            <SelectField label="Qualification" value={current.qualification} options={QUALIFICATION_OPTIONS} onChange={v => updateField('qualification', v)} />
            <TextField label="Occupation" value={current.occupation} onChange={v => updateField('occupation', v)} placeholder="e.g. Teacher" />
            <TextField label="Mother Tongue" value={current.motherTongue} onChange={v => updateField('motherTongue', v)} placeholder="e.g. Tamil" />

            {/* Section: Location */}
            <div className="col-span-2 mt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Location</p>
            </div>
            <TextField label="Native Place" value={current.nativePlace} onChange={v => updateField('nativePlace', v)} placeholder="City/Village" />
            <TextField label="Current Location" value={current.currentLocation} onChange={v => updateField('currentLocation', v)} placeholder="City" />
            <TextField label="District" value={current.district} onChange={v => updateField('district', v)} placeholder="District" />
            <TextField label="State" value={current.state} onChange={v => updateField('state', v)} placeholder="State" />
            <SelectField label="Dialect Zone" value={current.dialectZone} options={DIALECT_ZONES} onChange={v => updateField('dialectZone', v)} />

            {/* Section: Recording */}
            <div className="col-span-2 mt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recording Details</p>
            </div>
            <SelectField label="Recording Device" value={current.recordingDevice} options={RECORDING_DEVICE_OPTIONS} onChange={v => updateField('recordingDevice', v)} />
            <SelectField label="Recording Environment" value={current.recordingEnvironment} options={RECORDING_ENV_OPTIONS} onChange={v => updateField('recordingEnvironment', v)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/5">
          <p className="text-xs text-muted-foreground">
            <span className="text-red-500">*</span> Required fields: Name, Age, Gender
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save Metadata</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
