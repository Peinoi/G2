<template>
  <div>
    <div class="main-container">
      <div class="editor-container editor-container_classic-editor" ref="editorContainerElement">
        <div class="editor-container__editor">
          <div ref="editorElement">
            <ckeditor v-if="isLayoutReady" v-model="editorData" :editor="editor" :config="config" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  ClassicEditor,
  AccessibilityHelp,
  Alignment,
  AutoImage,
  Autosave,
  Base64UploadAdapter,
  Bold,
  Essentials,
  Heading,
  Highlight,
  ImageBlock,
  ImageCaption,
  ImageInline,
  ImageInsert,
  ImageInsertViaUrl,
  ImageResize,
  ImageStyle,
  ImageTextAlternative,
  ImageToolbar,
  ImageUpload,
  Italic,
  Link,
  LinkImage,
  List,
  ListProperties,
  Paragraph,
  PasteFromOffice,
  SelectAll,
  Strikethrough,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TodoList,
  Underline,
  Undo
} from 'ckeditor5';

import translations from 'ckeditor5/translations/ko.js';

import 'ckeditor5/ckeditor5.css';


 export default {
  name: 'MyEditor',
  // 1. modelValue (내용)를 props로 받습니다.
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  // 2. update:modelValue 이벤트를 발생시킵니다.
  emits: ['update:modelValue'],
  data() {
    return {
      isLayoutReady: false,
      config: null,
      editor: ClassicEditor,
      // 3. 내부적으로 에디터 내용을 관리할 로컬 변수
      editorData: this.modelValue // props의 초기값을 로컬 데이터에 설정
    };
  },
  watch: {
    // 4. 로컬 editorData가 변경될 때마다 부모에게 전달
    editorData(newValue) {
      this.$emit('update:modelValue', newValue);
    }
    // 5. 외부에서 modelValue가 변경되면 로컬 데이터도 업데이트 (필요한 경우)
    // modelValue(newValue) {
    //   this.editorData = newValue;
    // }
  },
  mounted() {
    this.config = {
      toolbar: {
        items: [
          'undo',
          'redo',
          '|',
          'selectAll',
          '|',
          'heading',
          '|',
          'bold',
          'italic',
          'underline',
          'strikethrough',
          '|',
          'link',
          'insertImage',
          'insertImageViaUrl',
          'insertTable',
          'highlight',
          '|',
          'alignment',
          '|',
          'bulletedList',
          'numberedList',
          'todoList',
          '|',
          'accessibilityHelp'
        ],
        shouldNotGroupWhenFull: false
      },
      plugins: [
        AccessibilityHelp,
        Alignment,
        AutoImage,
        Autosave,
        Base64UploadAdapter,
        Bold,
        Essentials,
        Heading,
        Highlight,
        ImageBlock,
        ImageCaption,
        ImageInline,
        ImageInsert,
        ImageInsertViaUrl,
        ImageResize,
        ImageStyle,
        ImageTextAlternative,
        ImageToolbar,
        ImageUpload,
        Italic,
        Link,
        LinkImage,
        List,
        ListProperties,
        Paragraph,
        PasteFromOffice,
        SelectAll,
        Strikethrough,
        Table,
        TableCaption,
        TableCellProperties,
        TableColumnResize,
        TableProperties,
        TableToolbar,
        TodoList,
        Underline,
        Undo
      ],
      heading: {
        options: [
          {
            model: 'paragraph',
            title: 'Paragraph',
            class: 'ck-heading_paragraph'
          },
          {
            model: 'heading1',
            view: 'h1',
            title: 'Heading 1',
            class: 'ck-heading_heading1'
          },
          {
            model: 'heading2',
            view: 'h2',
            title: 'Heading 2',
            class: 'ck-heading_heading2'
          },
          {
            model: 'heading3',
            view: 'h3',
            title: 'Heading 3',
            class: 'ck-heading_heading3'
          },
          {
            model: 'heading4',
            view: 'h4',
            title: 'Heading 4',
            class: 'ck-heading_heading4'
          },
          {
            model: 'heading5',
            view: 'h5',
            title: 'Heading 5',
            class: 'ck-heading_heading5'
          },
          {
            model: 'heading6',
            view: 'h6',
            title: 'Heading 6',
            class: 'ck-heading_heading6'
          }
        ]
      },
      image: {
        toolbar: [
          'toggleImageCaption',
          'imageTextAlternative',
          '|',
          'imageStyle:inline',
          'imageStyle:wrapText',
          'imageStyle:breakText',
          '|',
          'resizeImage'
        ]
      },
      initialData:
          '<h2>Congratulations on setting up CKEditor 5! 🎉</h2>\n<p>\n    You\'ve successfully created a CKEditor 5 project. This powerful text editor will enhance your application, enabling rich text editing\n    capabilities that are customizable and easy to use.\n</p>\n<h3>What\'s next?</h3>\n<ol>\n    <li>\n        <strong>Integrate into your app</strong>: time to bring the editing into your application. Take the code you created and add to your\n        application.\n    </li>\n    <li>\n        <strong>Explore features:</strong> Experiment with different plugins and toolbar options to discover what works best for your needs.\n    </li>\n    <li>\n        <strong>Customize your editor:</strong> Tailor the editor\'s configuration to match your application\'s style and requirements. Or even\n        write your plugin!\n    </li>\n</ol>\n<p>\n    Keep experimenting, and don\'t hesitate to push the boundaries of what you can achieve with CKEditor 5. Your feedback is invaluable to us\n    as we strive to improve and evolve. Happy editing!\n</p>\n<h3>Helpful resources</h3>\n<ul>\n    <li>📝 Trial sign up,\n    <li>📕 Documentation,\n    <li>⭐️ GitHub (star us if you can!),\n    <li>🏠 CKEditor Homepage,\n    <li>🧑‍💻 CKEditor 5 Demos,\n</ul>\n<h3>Need help?</h3>\n<p>\n    See this text, but the editor is not starting up? Check the browser\'s console for clues and guidance. It may be related to an incorrect\n    license key if you use premium features or another feature-related requirement. If you cannot make it work, file a GitHub issue, and we\n    will help as soon as possible!\n</p>\n',
      language: 'ko',
      link: {
        addTargetToExternalLinks: true,
        defaultProtocol: 'https://',
        decorators: {
          toggleDownloadable: {
            mode: 'manual',
            label: 'Downloadable',
            attributes: {
              download: 'file'
            }
          }
        }
      },
      list: {
        properties: {
          styles: true,
          startIndex: true,
          reversed: true
        }
      },
      menuBar: {
        isVisible: true
      },
      placeholder: 'Type or paste your content here!',
      table: {
        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
      },
      translations: [translations]
    };

    this.isLayoutReady = true;
  }
};
</script>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400;1,700&display=swap');

@media print {
	body {
		margin: 0 !important;
	}
}

.main-container {
	font-family: 'Lato';
	width: fit-content;
	margin-left: auto;
	margin-right: auto;
}

.ck-content {
	font-family: 'Lato';
	line-height: 1.6;
	word-break: break-word;
}

.editor-container_classic-editor .editor-container__editor {
    /* min-width를 제거하거나 100%로 설정하여 부모 컨테이너(700px)를 넘지 않도록 합니다. */
    min-width: 100%; 
    max-width: 100%;
}
</style>