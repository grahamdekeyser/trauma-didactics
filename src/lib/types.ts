export type SessionType = "breakfast_club" | "fracture_conference" | "virtuohsu";

export type Paper = {
  id: string;
  sessionId: string;
  title: string;
  citation: string | null;
  pubmedUrl: string | null;
  pdfPath: string | null;
  needsCleanup: boolean;
};

export type Session = {
  id: string;
  type: SessionType;
  date: string;
  topic: string | null;
  webexUrl: string | null;
  isCancelled: boolean;
  cancellationNote: string | null;
  papers: Paper[];
};

export type WishListItem = {
  id: string;
  topic: string;
  submitterName: string;
  votes: number;
  createdAt: string;
};

export type ResearchIdea = {
  id: string;
  title: string;
  references: string;
  description: string;
  submitterRole: "resident" | "faculty";
  createdAt: string;
};

export type Webinar = {
  id: string;
  title: string;
  date: string;
  url: string;
  source: string | null;
};

export type ResourceLink = {
  id: string;
  label: string;
  url: string;
  order: number;
};

export type TeachingCase = {
  id: string;
  fractureType: string;
  notes: string | null;
  submitterName: string | null;
  submittedAt: string;
};

export const FRACTURE_TYPES = [
  "Distal Radius",
  "Both Bone Forearm",
  "Galeazzi",
  "Essex Lopresti",
  "Monteggia",
  "Transolecranon",
  "Terrible Triad",
  "Distal Humerus",
  "Extra articular distal humerus",
  "Humerus Shaft",
  "Proximal humerus",
  "Scapula",
  "Clavicle",
  "SC Dislocation",
  "Pelvis- LC1",
  "Pelvis- LC2",
  "Pelvis- LC3",
  "Pelvis- VS",
  "Pelvis- APC",
  "Pelvis- Not classified",
  "Pelvis/Acetabulum",
  "Acetabulum- PW",
  "Acetabulum- PC",
  "Acetabulum- ACPHT",
  "Acetabulum- AC",
  "Acetabulum- Transverse",
  "Acetabulum- Transverse + PW",
  "Acetabulum- T-Shaped",
  "Femoral Head",
  "Femoral neck",
  "Intertroch",
  "Subtroch",
  "Atypical Femur Fx",
  "Periprosthetic Hip",
  "Distal Femur",
  "Periprosthetic Distal Femur",
  "Patella",
  "Tibial plateau- Unicondylar",
  "Tibial Plateau- bicondylar",
  "Tibial Plateau- Hyperextension",
  "Knee Dislocation",
  "Tibia Shaft- Proximal",
  "Tibia shaft",
  "Tibia Shaft- Distal",
  "Pilon- C Type",
  "Pilon- B Type",
  "Rotational Ankle- SER",
  "Rotational Ankle- SAD",
  "Rotational Ankle- Weber C",
  "Rotational Ankle- Poor Host",
  "Talus- Body",
  "Talus- Neck",
  "Calcaneus- Tongue Type",
  "Calcaneus- Depression Type",
  "Cuboid",
  "Navicular",
  "Lisfranc",
  "Nonunion",
  "Malunion",
] as const;

export type FractureType = (typeof FRACTURE_TYPES)[number];

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  breakfast_club: "Breakfast Club",
  fracture_conference: "Fracture Conference",
  virtuohsu: "VirtuOHSU",
};
