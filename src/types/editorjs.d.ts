declare module '@editorjs/header' {
  const Header: unknown
  export default Header
}

declare module '@editorjs/list' {
  const List: unknown
  export default List
}

declare module '@editorjs/underline' {
  const Underline: unknown
  export default Underline
}

declare module '@editorjs/inline-code' {
  const InlineCode: unknown
  export default InlineCode
}

declare module '@editorjs/marker' {
  const Marker: unknown
  export default Marker
}

declare module '@editorjs/quote' {
  const Quote: unknown
  export default Quote
}

declare module '@editorjs/delimiter' {
  const Delimiter: unknown
  export default Delimiter
}

declare module '@editorjs/image' {
  class ImageTool {
    static get toolbox(): { icon: string; title: string }
  }
  export default ImageTool
}

declare module 'editorjs-drag-drop' {
  export default class DragDrop {
    constructor(editor: unknown)
  }
}

declare module '@editorjs/checklist' {
  const Checklist: unknown
  export default Checklist
}

declare module '@editorjs/table' {
  const Table: unknown
  export default Table
}

declare module '@editorjs/code' {
  const Code: unknown
  export default Code
}
