import type {
  ResearchIdea,
  ResourceLink,
  Session,
  Webinar,
  WishListItem,
} from "./types";

const MOCK_WEBEX_URL = "https://example.webex.com/mock-meeting";

export const mockUpcomingSessions: Session[] = [
  {
    id: "s-upcoming-1",
    type: "breakfast_club",
    date: "2026-04-22",
    topic: "Distal Radius Fractures — Dorsal Spanning Plate",
    webexUrl: MOCK_WEBEX_URL,
    isCancelled: false,
    cancellationNote: null,
    papers: [
      {
        id: "p-1",
        sessionId: "s-upcoming-1",
        title: "Dorsal spanning plate fixation of distal radius fractures",
        citation: "JBJS 2021",
        pubmedUrl: null,
        pdfPath: null,
        needsCleanup: false,
      },
    ],
  },
  {
    id: "s-upcoming-2",
    type: "breakfast_club",
    date: "2026-04-29",
    topic: "Geriatric Elbow Fractures",
    webexUrl: MOCK_WEBEX_URL,
    isCancelled: false,
    cancellationNote: null,
    papers: [],
  },
];

export const mockPastSessions: Session[] = [
  {
    id: "s-past-1",
    type: "breakfast_club",
    date: "2026-04-08",
    topic: "Open Fractures",
    webexUrl: MOCK_WEBEX_URL,
    isCancelled: false,
    cancellationNote: null,
    papers: [
      {
        id: "p-past-1",
        sessionId: "s-past-1",
        title: "Gustilo-Anderson classification outcomes",
        citation: "JOT 2019",
        pubmedUrl: null,
        pdfPath: null,
        needsCleanup: true,
      },
    ],
  },
  {
    id: "s-past-2",
    type: "breakfast_club",
    date: "2026-03-11",
    topic: "Multimodal Pain Control",
    webexUrl: MOCK_WEBEX_URL,
    isCancelled: false,
    cancellationNote: null,
    papers: [
      {
        id: "p-past-2",
        sessionId: "s-past-2",
        title: "Multimodal analgesia in orthopaedic trauma",
        citation: "JBJS 2022",
        pubmedUrl: null,
        pdfPath: null,
        needsCleanup: false,
      },
    ],
  },
  {
    id: "s-past-3",
    type: "breakfast_club",
    date: "2026-03-04",
    topic: "Femoral Head Fractures",
    webexUrl: MOCK_WEBEX_URL,
    isCancelled: false,
    cancellationNote: null,
    papers: [],
  },
];

export const mockWishList: WishListItem[] = [
  {
    id: "w-1",
    topic: "Elbow instability management",
    submitterName: "R. Smith, PGY-3",
    votes: 4,
    createdAt: "2026-04-10T10:00:00Z",
  },
  {
    id: "w-2",
    topic: "Femoral neck fracture in young patients",
    submitterName: "J. Doe, PGY-4",
    votes: 2,
    createdAt: "2026-04-12T10:00:00Z",
  },
];

export const mockResearchIdeas: ResearchIdea[] = [
  {
    id: "r-1",
    title: "Outcomes of dorsal spanning plate vs external fixator in DRF",
    references: "JBJS 2021; JOT 2019",
    description:
      "Retrospective review of institutional data for comminuted distal radius fractures.",
    submitterRole: "resident",
    createdAt: "2026-04-05T10:00:00Z",
  },
];

export const mockWebinars: Webinar[] = [
  {
    id: "wb-1",
    title: "OTA Webinar: Pelvic Ring Injuries",
    date: "2026-05-01",
    url: "https://ota.org",
    source: "OTA",
  },
];

export const mockResources: ResourceLink[] = [
  { id: "res-1", label: "Case clips (OHSU)", url: "#", order: 1 },
  { id: "res-2", label: "AO Surgery Reference", url: "https://surgeryreference.aofoundation.org/", order: 2 },
  { id: "res-3", label: "OTA Fracture Textbook", url: "https://ota.org", order: 3 },
  { id: "res-4", label: "OrthoBullets", url: "https://www.orthobullets.com/", order: 4 },
];
