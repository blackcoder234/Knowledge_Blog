import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageResizeComponent } from './ImageResizeComponent';

export const ImageResizeExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => element.style.width || element.getAttribute('width'),
        renderHTML: (attributes) => {
            if (!attributes.width) return {};
            return {
                style: `width: ${attributes.width}`
            }
        }
      },
      height: {
        default: 'auto',
        parseHTML: (element) => element.style.height || element.getAttribute('height'),
      },
      textAlign: {
        default: 'center',
        parseHTML: (element) => element.style.textAlign || element.getAttribute('data-text-align'),
        renderHTML: (attributes) => {
            if (!attributes.textAlign) return {};
            return {
                style: `text-align: ${attributes.textAlign}`
            }
        }
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
      {
        tag: 'figure img[src]',
      },
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeComponent);
  },
});
