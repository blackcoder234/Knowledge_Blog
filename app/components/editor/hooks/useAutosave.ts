import { useCallback, useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import { debounce } from 'lodash'; // You might need to install lodash or write a simple debounce

interface UseAutosaveProps {
  editor: Editor | null;
  onSave?: (content: any) => Promise<void> | void;
  debounceMs?: number;
}

export const useAutosave = ({ editor, onSave, debounceMs = 1000 }: UseAutosaveProps) => {
  const [status, setStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const debouncedSave = useCallback(
    debounce(async (json: any) => {
      setStatus('saving');
      try {
        if (onSave) {
          await onSave(json);
        }
        setLastSaved(new Date());
        setStatus('saved');
        
        // Mock save for localStorage just in case
        localStorage.setItem('editor-content', JSON.stringify(json));
        
      } catch (error) {
        console.error('Autosave failed:', error);
        setStatus('unsaved');
      }
    }, debounceMs),
    [onSave, debounceMs]
  );

  const triggerSave = useCallback(async () => {
    if (!editor) return;
    const json = editor.getJSON();
    setStatus('saving');
    try {
      if (onSave) {
        await onSave(json);
      }
      setLastSaved(new Date());
      setStatus('saved');
      localStorage.setItem('editor-content', JSON.stringify(json));
    } catch (error) {
       console.error('Manual save failed:', error);
       setStatus('unsaved');
    }
  }, [editor, onSave]);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setStatus('unsaved');
      debouncedSave(editor.getJSON());
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      debouncedSave.cancel();
    };
  }, [editor, debouncedSave]);

  return { status, lastSaved, triggerSave, setStatus };
};
