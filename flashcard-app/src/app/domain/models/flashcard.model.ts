export interface Flashcard {
  id: string;
  hoofdstuk?: number;
  domein: string;
  subdomein?: string;
  type: string;
  voorkant: string;
  achterkant: string;
  geheugensteun?: string | null;
}
