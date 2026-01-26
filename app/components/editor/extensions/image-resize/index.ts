import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageResizeComponent } from './ImageResizeComponent';

export const ImageResizeExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: (attributes) => {
            return {
                style: `width: ${attributes.width}`
            }
        }
      },
      height: {
        default: 'auto',
      },
      textAlign: {
        default: 'center',
         renderHTML: (attributes) => {
            return {
                style: `text-align: ${attributes.textAlign}`
            }
        }
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeComponent);
  },
});
