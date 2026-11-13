import { create } from 'zustand';

interface EditorState {
  /** Current SQL in the editor */
  sql: string;
  /** Selected engine */
  engine: 'sqlite' | 'pglite' | 'mysql' | 'pandas';
  /** Font size for the editor */
  fontSize: number;

  setSql: (sql: string) => void;
  setEngine: (engine: EditorState['engine']) => void;
  setFontSize: (size: number) => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  sql: '',
  engine: 'sqlite',
  fontSize: 14,

  setSql: (sql) => set({ sql }),
  setEngine: (engine) => set({ engine }),
  setFontSize: (fontSize) => set({ fontSize }),
}));
