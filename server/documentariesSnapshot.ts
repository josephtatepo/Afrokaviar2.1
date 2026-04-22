export type DocumentarySnapshot = {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  category: string;
  speaker: string;
  type: "Documentary" | "Feature";
};

export const DOCUMENTARIES_SNAPSHOT: DocumentarySnapshot[] = [
  { id: "1", title: "The African Origin of Civilization", description: "The scientific and linguistic legacy of Cheikh Anta Diop.", youtubeId: "D_SSHt74zdQ", category: "History", speaker: "Cheikh Anta Diop", type: "Documentary" },
  { id: "2", title: "Stone & Spirit", description: "Mathematical principles and stellar alignment of Kemet.", youtubeId: "2fI0E8B2tFw", category: "Architecture", speaker: "Various", type: "Documentary" },
  { id: "3", title: "The Golden Age of Timbuktu", description: "Restoration of the world's oldest African manuscripts.", youtubeId: "5X-M7LUM3vA", category: "Education", speaker: "Archive Scholars", type: "Documentary" },
  { id: "4", title: "I Am Not Your Negro", description: "James Baldwin\u2019s unfinished manuscript on American race.", youtubeId: "TO2PsTnqgUE", category: "Philosophy", speaker: "James Baldwin", type: "Documentary" },
  { id: "5", title: "Concerning Violence", description: "Visual narrative of Fanon\u2019s Wretched of the Earth.", youtubeId: "OOfmE6O8Sls", category: "Geopolitics", speaker: "Frantz Fanon", type: "Documentary" },
  { id: "6", title: "Summer of Soul", description: "The 1969 Harlem Cultural Festival: Music and Black joy.", youtubeId: "M07tV_WjLls", category: "Culture", speaker: "Questlove / Various", type: "Documentary" },
  { id: "7", title: "The Black Power Mixtape", description: "Found footage of the 1967-1975 Black Power Movement.", youtubeId: "vf1-Z24a_7I", category: "Sociology", speaker: "Stokely Carmichael", type: "Documentary" },
  { id: "8", title: "Mansa Musa: The Richest Man", description: "The wealth and pilgrimage of the Mali Empire\u2019s leader.", youtubeId: "AZbM-gk965s", category: "Wealth", speaker: "Mansa Musa", type: "Documentary" },
  { id: "9", title: "Sankara's Ghost", description: "The revolutionary life and assassination of Thomas Sankara.", youtubeId: "cobVBgQKdlc", category: "Leadership", speaker: "Thomas Sankara", type: "Documentary" },
  { id: "10", title: "Great Zimbabwe: Lost Kingdoms", description: "Exploring the stone architectural genius of Southern Africa.", youtubeId: "U2JR2FVrDHM", category: "Architecture", speaker: "BBC/Various", type: "Documentary" },
  { id: "11", title: "Slavery by Another Name", description: "The re-enslavement of Black Americans from the Civil War.", youtubeId: "z9QS7SZVarY", category: "Justice", speaker: "Douglas Blackmon", type: "Documentary" },
  { id: "12", title: "The Kingdom of Aksum", description: "Ethiopia\u2019s ancient civilization and the Ark of the Covenant.", youtubeId: "O-wAnx_5iTo", category: "Antiquity", speaker: "Various", type: "Documentary" },
  { id: "13", title: "1804: Hidden History of Haiti", description: "The untold story of the only successful slave revolution.", youtubeId: "9Z7yYp5W2y8", category: "Revolution", speaker: "Tariq Nasheed", type: "Documentary" },
  { id: "14", title: "L'Origine Africaine des Anciens Egyptiens", description: "Cheikh Anta Diop - Le Savant qui a prouv\u00e9 l'Origine Africaine des Anciens Egyptiens - UNESCO - 1980", youtubeId: "D_SSHt74zdQ", category: "History", speaker: "Cheikh Anta Diop", type: "Documentary" },
];
