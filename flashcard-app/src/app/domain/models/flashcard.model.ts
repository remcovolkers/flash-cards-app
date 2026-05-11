export interface Flashcard {
  id: string;
  domein: string;
  subdomein?: string;
  type: string;
  voorkant: string;
  achterkant: string;
  geheugensteun?: string | null;
}
