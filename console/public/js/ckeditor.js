'use strict'

import {
  Alignment,
  Autoformat,
  AutoLink,
  Autosave,
  BlockQuote,
  Bold,
  ClassicEditor,
  Code,
  DecoupledEditor,
  Essentials,
  HorizontalLine,
  Italic,
  Link,
  List,
  Paragraph,
  SourceEditing,
  Strikethrough,
  TextPartLanguage,
  TextTransformation,
  TodoList,
  Underline,
} from '../dependencies/ckeditor5/ckeditor5.js'
import translations from '../dependencies/ckeditor5/translations/fr.js'

const editorConfig = {
  toolbar: {
    items: [
      'undo',
      'redo',
      '|',
      'sourceEditing',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'code',
      '|',
      'horizontalLine',
      'link',
      'blockQuote',
      '|',
      'alignment',
      '|',
      'bulletedList',
      'numberedList',
    ],
    shouldNotGroupWhenFull: false,
  },
  plugins: [
    Alignment,
    Autoformat,
    AutoLink,
    Autosave,
    BlockQuote,
    Bold,
    Code,
    Essentials,
    HorizontalLine,
    Italic,
    Link,
    List,
    Paragraph,
    SourceEditing,
    Strikethrough,
    TextPartLanguage,
    TextTransformation,
    TodoList,
    Underline,
  ],
  initialData: '',
  language: 'fr',
  licenseKey: 'GPL',
  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: 'https://',
  },
  placeholder: 'Tapez ou collez votre contenu ici...',
  translations: [translations],
}

export async function buildCKEditor(target, input = '') {
  editorConfig.initialData = input

  return await ClassicEditor.create(target, editorConfig)
}

export async function buildDecoupledEditor(target, input = '') {
  editorConfig.initialData = input

  return await DecoupledEditor.create(target, editorConfig)
}
