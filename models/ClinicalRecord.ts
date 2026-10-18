import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPsychiatricHistory {
  presentingHistory: string;
  previousTreatment: string;
  previousDiagnoses: string;
  hospitalizationHistory: string;
  treatmentResponse: string;
  relevantHistory: string;
}

export interface IMedicalHistory {
  chronicConditions: string;
  surgeries: string;
  neurologicalHistory: string;
  currentPhysicalIllnesses: string;
}

export interface IPersonalHistory {
  birthPerinatal: string;
  developmentalMilestones: string;
  educationalHistory: string;
  occupationalHistory: string;
}

export interface IFamilyHistory {
  mentalHealthDisorders: string;
  substanceMisuse: string;
  completedSuicides: string;
  familyStructure: string;
}

export interface ISocialHistory {
  livingSituation: string;
  psychosocialStressors: string;
  substanceUseProfile: {
    alcohol: string;
    tobacco: string;
    illicit: string;
  };
  legalHistory: string;
}

export interface IMSE {
  appearance: string;
  behavior: string;
  speech: string;
  mood: string;
  affect: string;
  thoughtContent: string;
  thoughtProcess: string;
  perception: string;
  cognition: string;
  insight: string;
  judgment: string;
}

export interface IRiskAssessment {
  suicideRisk: 'Low' | 'Moderate' | 'High';
  homicideRisk: 'Low' | 'Moderate' | 'High';
  selfHarmRisk: 'Low' | 'Moderate' | 'High';
  vulnerabilityRisk: 'Low' | 'Moderate' | 'High';
  riskNotes: string;
}

export interface IClinicalRecord extends Document {
  patientId: string;
  psychiatricHistory: IPsychiatricHistory;
  medicalHistory: IMedicalHistory;
  personalHistory: IPersonalHistory;
  familyHistory: IFamilyHistory;
  socialHistory: ISocialHistory;
  mentalStatusExam: IMSE;
  riskAssessment: IRiskAssessment;
  recordType?: string;
  details?: any;
  author?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicalRecordSchema: Schema = new Schema<IClinicalRecord>(
  {
    patientId: { type: String, required: true, index: true },
    psychiatricHistory: {
      presentingHistory: { type: String, default: '' },
      previousTreatment: { type: String, default: '' },
      previousDiagnoses: { type: String, default: '' },
      hospitalizationHistory: { type: String, default: '' },
      treatmentResponse: { type: String, default: '' },
      relevantHistory: { type: String, default: '' },
    },
    medicalHistory: {
      chronicConditions: { type: String, default: '' },
      surgeries: { type: String, default: '' },
      neurologicalHistory: { type: String, default: '' },
      currentPhysicalIllnesses: { type: String, default: '' },
    },
    personalHistory: {
      birthPerinatal: { type: String, default: '' },
      developmentalMilestones: { type: String, default: '' },
      educationalHistory: { type: String, default: '' },
      occupationalHistory: { type: String, default: '' },
    },
    familyHistory: {
      mentalHealthDisorders: { type: String, default: '' },
      substanceMisuse: { type: String, default: '' },
      completedSuicides: { type: String, default: '' },
      familyStructure: { type: String, default: '' },
    },
    socialHistory: {
      livingSituation: { type: String, default: '' },
      psychosocialStressors: { type: String, default: '' },
      substanceUseProfile: {
        alcohol: { type: String, default: '' },
        tobacco: { type: String, default: '' },
        illicit: { type: String, default: '' },
      },
      legalHistory: { type: String, default: '' },
    },
    mentalStatusExam: {
      appearance: { type: String, default: '' },
      behavior: { type: String, default: '' },
      speech: { type: String, default: '' },
      mood: { type: String, default: '' },
      affect: { type: String, default: '' },
      thoughtContent: { type: String, default: '' },
      thoughtProcess: { type: String, default: '' },
      perception: { type: String, default: '' },
      cognition: { type: String, default: '' },
      insight: { type: String, default: '' },
      judgment: { type: String, default: '' },
    },
    riskAssessment: {
      suicideRisk: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Low' },
      homicideRisk: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Low' },
      selfHarmRisk: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Low' },
      vulnerabilityRisk: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Low' },
      riskNotes: { type: String, default: '' },
    },
    recordType: { type: String, default: 'CLINICAL_RECORD' },
    details: { type: Schema.Types.Mixed, default: {} },
    author: { type: String, default: 'System' },
    createdBy: { type: String, default: 'System' },
    updatedBy: { type: String, default: 'System' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

ClinicalRecordSchema.index({ patientId: 1, createdAt: -1 });

const ClinicalRecord: Model<IClinicalRecord> =
  mongoose.models.ClinicalRecord || mongoose.model<IClinicalRecord>('ClinicalRecord', ClinicalRecordSchema);

export default ClinicalRecord;
