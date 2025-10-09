import React, { useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-react';

// Регистрируем модуль изменения размера изображений
Quill.register('modules/imageResize', ImageResize);

// Расширяем формат изображения для сохранения всех атрибутов
const ImageFormatAttributesList = ['alt', 'height', 'width', 'style', 'class'];
const BaseImageFormat = Quill.import('formats/image');

class CustomImageFormat extends BaseImageFormat {
  static formats(domNode: any) {
    const formats: any = {};
    ImageFormatAttributesList.forEach((attribute) => {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
    });
    return formats;
  }

  format(name: string, value: any) {
    if (ImageFormatAttributesList.indexOf(name) > -1) {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }

  static create(value: any) {
    const node = super.create(value);
    if (typeof value === 'object') {
      // Если value это объект с атрибутами (из Delta)
      node.setAttribute('src', value.src || value.image || value);
    } else {
      node.setAttribute('src', value);
    }
    return node;
  }
}

Quill.register(CustomImageFormat, true);

interface RichTextEditorProps {
  value: string;
  delta?: any;  // Quill Delta объект
  onChange: (value: string, delta: any) => void;  // Возвращаем и HTML и Delta
  placeholder?: string;
  disabled?: boolean;
  editorKey?: string;  // Ключ для пересоздания компонента
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  delta,
  onChange,
  placeholder = 'Введите текст...',
  disabled = false,
  editorKey,
}) => {
  const quillRef = React.useRef<ReactQuill>(null);
  const [content, setContent] = React.useState('');
  const initializedRef = React.useRef(false);

  // Загружаем Delta ТОЛЬКО при первоначальном монтировании компонента
  React.useEffect(() => {
    if (!initializedRef.current && quillRef.current) {
      const quill = quillRef.current.getEditor();

      if (delta) {
        // Если есть Delta - загружаем его
        quill.setContents(delta);

        // ВАЖНО: Применяем атрибуты к изображениям после загрузки Delta
        setTimeout(() => {
          const images = quill.root.querySelectorAll('img');

          let imageIndex = 0;
          delta.ops?.forEach((op: any) => {
            if (op.insert?.image && op.attributes) {
              const img = images[imageIndex];
              if (img) {
                Object.keys(op.attributes).forEach((attr) => {
                  img.setAttribute(attr, op.attributes[attr]);
                });
              }
              imageIndex++;
            }
          });
        }, 100);

        setContent(quill.root.innerHTML);
      } else {
        // Если нет Delta - используем HTML
        quill.clipboard.dangerouslyPasteHTML(value);
        setContent(value);
      }

      initializedRef.current = true;
    }
  }, []); // Пустой массив зависимостей - только при монтировании!

  const handleChange = (htmlContent: string, _delta: any, _source: any, editor: any) => {
    setContent(htmlContent);
    const currentDelta = editor.getContents();
    onChange(htmlContent, currentDelta);
  };

  // Настройка панели инструментов Quill
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      imageResize: {
        parchment: Quill.import('parchment'),
        modules: ['Resize', 'DisplaySize', 'Toolbar'],
      },
    }),
    []
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'indent',
    'align',
    'link',
    'image',
    'video',
  ];

  return (
    <div className="rich-text-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={content}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
      />
    </div>
  );
};

export default RichTextEditor;
