import React, { useEffect, useRef, useCallback } from 'react'
import EditorJS, {
  BlockToolConstructable,
  InlineToolConstructable,
  type LogLevels,
  type API
} from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Underline from '@editorjs/underline'
import InlineCode from '@editorjs/inline-code'
import Marker from '@editorjs/marker'
import Quote from '@editorjs/quote'
import Delimiter from '@editorjs/delimiter'
import DragDrop from 'editorjs-drag-drop'
import Table from '@editorjs/table'
import CodeTool from '@editorjs/code'
import 'katex/dist/katex.min.css'
import {
  parseMarkdownToBlocks,
  serializeBlocksToMarkdown
} from '../utils/markdownConverter'
import {
  CustomImageTool,
  StrikethroughInlineTool,
  VideoTool,
  EmbedTool,
  ChecklistTool,
  MathTool,
  MermaidTool
} from './editor/tools'
import { EditorHistoryManager, EditorJSData, EditorJSBlock } from './editor/EditorHistoryManager'

const H1_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8m-8-8v16m8-16v16"/><path d="m18 10 2-2v12"/></svg>'
const H2_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8m-8-8v16m8-16v16"/><path d="M21 18h-4c0-4 4-3 4-6a2 2 0 0 0-4-1"/></svg>'
const H3_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8m-8-8v16m8-16v16"/><path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2m2 0a2 2 0 0 1-2 2c0 1.5-1.8 2.5-3.5 1.5"/></svg>'
const H4_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8m-8-8v16m8-16v16"/><path d="M17 10v4h4m0-4v8"/></svg>'

// Simple Markdown parser to Editor.js JSON data
function parseMarkdownToEditorJS(text: string): EditorJSData {
  const blocks = parseMarkdownToBlocks(text) as EditorJSBlock[]
  return { blocks }
}

// Convert Editor.js JSON data back to Markdown
function serializeEditorJSToMarkdown(data: EditorJSData): string {
  if (!data || !data.blocks) return ''
  return serializeBlocksToMarkdown(data.blocks)
}

// Helper to extend sanitization rules of a tool to allow wikilink elements
function allowWikilinksInSanitizer(toolClass: unknown): void {
  if (!toolClass || (typeof toolClass !== 'object' && typeof toolClass !== 'function')) return
  const tc = toolClass as { sanitize?: unknown }
  const originalSanitize = tc.sanitize
  Object.defineProperty(toolClass, 'sanitize', {
    get() {
      const base =
        typeof originalSanitize === 'function'
          ? (originalSanitize as () => Record<string, unknown>)()
          : (originalSanitize as Record<string, unknown>) || {}
      return {
        ...base,
        a: {
          ...(((base as Record<string, unknown>).a as Record<string, unknown>) || {}),
          class: true,
          'data-path': true,
          href: true
        }
      }
    },
    configurable: true
  })
}

allowWikilinksInSanitizer(Header)
allowWikilinksInSanitizer(List)
allowWikilinksInSanitizer(Quote)
allowWikilinksInSanitizer(Underline)
allowWikilinksInSanitizer(StrikethroughInlineTool)
allowWikilinksInSanitizer(Marker)

interface BlockEditorProps {
  value: string
  onChange: (value: string) => void
  activeFilePath?: string | null
  workspacePath?: string | null
  onWikilinkClick?: (targetName: string) => void
  readOnly?: boolean
  maxUndoHistory?: number
  spellcheck?: boolean
  wordWrap?: boolean
  tabSize?: number
}

function BlockEditorComponent({
  value,
  onChange,
  activeFilePath,
  workspacePath,
  onWikilinkClick,
  readOnly = false,
  maxUndoHistory = 50,
  spellcheck = true,
  wordWrap = true,
  tabSize = 2
}: BlockEditorProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<EditorJS | null>(null)
  const lastSerializedRef = useRef<string>('')
  const isLocalChangeRef = useRef<boolean>(false)
  const destroyingPromiseRef = useRef<Promise<void> | null>(null)

  const historyManagerRef = useRef<EditorHistoryManager>(new EditorHistoryManager(maxUndoHistory))

  // Apply typography, word wrap, tab size and spellcheck to editor container
  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.spellcheck = spellcheck
    containerRef.current.style.setProperty('--tab-size', `${tabSize}`)
    containerRef.current.style.tabSize = `${tabSize}`
    if (!wordWrap) {
      containerRef.current.classList.add('no-word-wrap')
    } else {
      containerRef.current.classList.remove('no-word-wrap')
    }
  }, [spellcheck, wordWrap, tabSize])

  useEffect(() => {
    historyManagerRef.current.setMaxHistoryLength(maxUndoHistory)
  }, [maxUndoHistory])

  const workspacePathRef = useRef(workspacePath)
  useEffect(() => {
    workspacePathRef.current = workspacePath
  }, [workspacePath])

  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const onWikilinkClickRef = useRef(onWikilinkClick)
  useEffect(() => {
    onWikilinkClickRef.current = onWikilinkClick
  }, [onWikilinkClick])

  // Safe helper to destroy an EditorJS instance
  const destroyInstance = async (instance: EditorJS): Promise<void> => {
    try {
      await instance.isReady
      if (typeof instance.destroy === 'function') {
        await instance.destroy()
      }
    } catch {
      // Instance may have unmounted or already been destroyed
    }
  }

  const changeDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingApiRef = useRef<API | null>(null)

  const flushPendingChanges = useCallback(async (): Promise<void> => {
    if (changeDebounceTimerRef.current) {
      clearTimeout(changeDebounceTimerRef.current)
      changeDebounceTimerRef.current = null
    }
    const editor = editorInstanceRef.current
    const api = pendingApiRef.current
    if (!editor && !api) return
    try {
      if (editor?.isReady) {
        await editor.isReady
      }
      let savedData: EditorJSData | null = null
      if (api?.saver) {
        savedData = (await api.saver.save()) as EditorJSData
      } else if (editor) {
        savedData = (await editor.save()) as EditorJSData
      }
      if (!savedData) return

      const markdown = serializeEditorJSToMarkdown(savedData)

      // Record snapshot to history stack if content changed and not in undo/redo execution
      if (!historyManagerRef.current.isExecutingUndoRedo) {
        historyManagerRef.current.record(savedData)
      }

      if (markdown !== lastSerializedRef.current) {
        isLocalChangeRef.current = true
        lastSerializedRef.current = markdown
        onChangeRef.current(markdown)
      }
    } catch (err) {
      console.error('Error saving EditorJS data on change:', err)
    }
  }, [])

  const handleUndo = useCallback(async (): Promise<void> => {
    const editor = editorInstanceRef.current
    if (!editor) return

    // Flush any typing change first so the current state is recorded
    if (changeDebounceTimerRef.current) {
      clearTimeout(changeDebounceTimerRef.current)
      changeDebounceTimerRef.current = null
      try {
        if (editor.isReady) {
          await editor.isReady
        }
        let currentData: EditorJSData | null = null
        if (typeof editor.save === 'function') {
          currentData = (await editor.save()) as EditorJSData
        } else if (typeof editor.saver?.save === 'function') {
          currentData = (await editor.saver.save()) as EditorJSData
        }
        if (currentData) {
          historyManagerRef.current.record(currentData)
        }
      } catch {
        // ignore
      }
    }

    await historyManagerRef.current.undo(editor, (targetData: EditorJSData) => {
      const markdown = serializeEditorJSToMarkdown(targetData)
      isLocalChangeRef.current = true
      lastSerializedRef.current = markdown
      onChangeRef.current(markdown)
    })
  }, [])

  const handleRedo = useCallback(async (): Promise<void> => {
    const editor = editorInstanceRef.current
    if (!editor) return

    await historyManagerRef.current.redo(editor, (targetData: EditorJSData) => {
      const markdown = serializeEditorJSToMarkdown(targetData)
      isLocalChangeRef.current = true
      lastSerializedRef.current = markdown
      onChangeRef.current(markdown)
    })
  }, [])

  // Listen for external undo/redo and voice narration dispatch events
  useEffect(() => {
    const handleOinkUndo = (): void => {
      void handleUndo()
    }
    const handleOinkRedo = (): void => {
      void handleRedo()
    }
    const handleOinkNewParagraph = (): void => {
      const editorInstance = editorInstanceRef.current
      if (editorInstance) {
        try {
          const index = editorInstance.blocks.getCurrentBlockIndex()
          const targetIndex = index >= 0 ? index + 1 : editorInstance.blocks.getBlocksCount()
          editorInstance.blocks.insert('paragraph', { text: '' }, {}, targetIndex, true)
          setTimeout(() => {
            try {
              editorInstance.caret.setToBlock(targetIndex, 'start')
            } catch {
              // ignore
            }
          }, 20)
        } catch (err) {
          console.error('Failed to create new paragraph block:', err)
        }
      }
    }
    const handleOinkClearBlock = (): void => {
      const editorInstance = editorInstanceRef.current
      if (editorInstance) {
        try {
          const index = editorInstance.blocks.getCurrentBlockIndex()
          if (index >= 0) {
            const block = editorInstance.blocks.getBlockByIndex(index)
            if (block?.id) {
              editorInstance.blocks.update(block.id, { text: '' })
            }
          }
        } catch {
          // ignore
        }
      }
    }

    window.addEventListener('oink:undo', handleOinkUndo)
    window.addEventListener('oink:redo', handleOinkRedo)
    window.addEventListener('oink:new-paragraph', handleOinkNewParagraph)
    window.addEventListener('oink:clear-block', handleOinkClearBlock)
    return (): void => {
      window.removeEventListener('oink:undo', handleOinkUndo)
      window.removeEventListener('oink:redo', handleOinkRedo)
      window.removeEventListener('oink:new-paragraph', handleOinkNewParagraph)
      window.removeEventListener('oink:clear-block', handleOinkClearBlock)
    }
  }, [handleUndo, handleRedo])

  // Initialize/reinitialize editor when file changes
  useEffect(() => {
    if (!containerRef.current) return

    let isDestroyed = false
    let editor: EditorJS | null = null

    const init = async (): Promise<void> => {
      if (destroyingPromiseRef.current) {
        try {
          await destroyingPromiseRef.current
        } catch {
          // Ignore cleanup race condition
        }
        destroyingPromiseRef.current = null
      }

      if (editorInstanceRef.current) {
        const previousInstance = editorInstanceRef.current
        editorInstanceRef.current = null
        destroyingPromiseRef.current = destroyInstance(previousInstance)
        try {
          await destroyingPromiseRef.current
        } catch {
          // Ignore cleanup race condition
        }
        destroyingPromiseRef.current = null
      }

      if (isDestroyed) return

      const parsedData = parseMarkdownToEditorJS(valueRef.current)
      historyManagerRef.current.initialize(parsedData)

      editor = new EditorJS({
        holder: containerRef.current || 'editorjs-container',
        logLevel: 'ERROR' as unknown as LogLevels,
        data: parsedData,
        sanitizer: {
          a: {
            class: 'wikilink',
            'data-path': true,
            href: true
          }
        },
        tools: {
          header: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Heading',
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2
            }
          },
          heading1: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Heading 1',
              levels: [1],
              defaultLevel: 1
            },
            toolbox: {
              title: 'Heading 1',
              icon: H1_ICON
            }
          },
          heading2: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Heading 2',
              levels: [2],
              defaultLevel: 2
            },
            toolbox: {
              title: 'Heading 2',
              icon: H2_ICON
            }
          },
          heading3: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Heading 3',
              levels: [3],
              defaultLevel: 3
            },
            toolbox: {
              title: 'Heading 3',
              icon: H3_ICON
            }
          },
          heading4: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Heading 4',
              levels: [4],
              defaultLevel: 4
            },
            toolbox: {
              title: 'Heading 4',
              icon: H4_ICON
            }
          },
          heading5: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Heading 5',
              levels: [5],
              defaultLevel: 5
            },
            toolbox: {
              title: 'Heading 5'
            }
          },
          heading6: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Heading 6',
              levels: [6],
              defaultLevel: 6
            },
            toolbox: {
              title: 'Heading 6'
            }
          },
          list: {
            class: List as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            }
          },
          checklist: {
            class: ChecklistTool as unknown as BlockToolConstructable,
            inlineToolbar: true
          },
          quote: {
            class: Quote as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Enter a quote'
            }
          },
          delimiter: Delimiter as unknown as BlockToolConstructable,
          image: {
            class: CustomImageTool as unknown as BlockToolConstructable,
            config: {
              uploader: {
                uploadByFile(file: File) {
                  return new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = async (e) => {
                      const dataUrl = e.target?.result as string
                      if (workspacePathRef.current && window.api?.fs?.saveAttachment) {
                        try {
                          await window.api.fs.saveAttachment(
                            workspacePathRef.current,
                            file.name || 'attachment.png',
                            dataUrl
                          )
                          resolve({
                            success: 1,
                            file: {
                              url: dataUrl
                            }
                          })
                          return
                        } catch (err) {
                          console.error(
                            'Failed saving attachment locally, falling back to dataUrl:',
                            err
                          )
                        }
                      }
                      resolve({
                        success: 1,
                        file: {
                          url: dataUrl
                        }
                      })
                    }
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                  })
                },
                uploadByUrl(url: string) {
                  return new Promise((resolve) => {
                    resolve({
                      success: 1,
                      file: {
                        url: url
                      }
                    })
                  })
                }
              }
            }
          },
          video: {
            class: VideoTool as unknown as BlockToolConstructable,
            toolbox: {
              title: 'Video',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>'
            }
          },
          embed: {
            class: EmbedTool as unknown as BlockToolConstructable,
            toolbox: {
              title: 'Embed',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
            }
          },
          table: {
            class: Table as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              rows: 2,
              cols: 2
            }
          },
          code: {
            class: CodeTool as unknown as BlockToolConstructable,
            inlineToolbar: false,
            config: {
              placeholder: 'Enter code here...'
            }
          },
          math: {
            class: MathTool as unknown as BlockToolConstructable
          },
          mermaid: {
            class: MermaidTool as unknown as BlockToolConstructable
          },
          underline: Underline as unknown as InlineToolConstructable,
          strikethrough: StrikethroughInlineTool as unknown as InlineToolConstructable,
          inlineCode: InlineCode as unknown as InlineToolConstructable,
          marker: Marker as unknown as InlineToolConstructable
        },
        readOnly: Boolean(readOnly),
        placeholder: "Press 'Tab' or click '+' to write...",
        onReady: () => {
          const inst = editorInstanceRef.current || editor
          if (inst) {
            new DragDrop(inst)
          }
        },
        onChange: (api) => {
          if (historyManagerRef.current.isExecutingUndoRedo) return
          pendingApiRef.current = api
          if (changeDebounceTimerRef.current) {
            clearTimeout(changeDebounceTimerRef.current)
          }
          changeDebounceTimerRef.current = setTimeout(() => {
            void flushPendingChanges()
          }, 150)
        }
      })

      editorInstanceRef.current = editor
      lastSerializedRef.current = valueRef.current
    }

    init()

    return () => {
      isDestroyed = true
      void flushPendingChanges()
      if (editor) {
        const instanceToDestroy = editor
        editorInstanceRef.current = null
        destroyingPromiseRef.current = destroyInstance(instanceToDestroy)
      }
    }
  }, [activeFilePath, readOnly, flushPendingChanges])

  // Handle value updates from parent (e.g. external edits, reload, etc.)
  useEffect(() => {
    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false
      return
    }

    if (value !== lastSerializedRef.current && editorInstanceRef.current) {
      const parsedData = parseMarkdownToEditorJS(value)
      editorInstanceRef.current.isReady
        .then(() => {
          editorInstanceRef.current?.blocks.render(parsedData)
          lastSerializedRef.current = value
          historyManagerRef.current.initialize(parsedData)
        })
        .catch(() => {
          // Ignore if editor instance was unmounted
        })
    }
  }, [value])

  // Key Event Remap Listener:
  // - Ctrl + Z -> Undo
  // - Ctrl + Y / Ctrl + Shift + Z -> Redo
  // - Enter -> Line Break inside block
  // - Ctrl + Enter -> New paragraph block below
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      // 1. Ctrl / Cmd + Z (Undo) and Ctrl + Y / Ctrl + Shift + Z (Redo)
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase()
        if (key === 'z' && !e.shiftKey) {
          e.preventDefault()
          e.stopPropagation()
          void handleUndo()
          return
        } else if (key === 'y' || (e.shiftKey && key === 'z')) {
          e.preventDefault()
          e.stopPropagation()
          void handleRedo()
          return
        }
      }

      // 2. Enter behavior: Shift+Enter -> Soft line break (<br>), Ctrl+Enter -> New block below
      if (e.key === 'Enter') {
        if (e.shiftKey && !e.ctrlKey) {
          // Shift + Enter -> insert line break inside current block using Selection/Range
          e.preventDefault()
          e.stopPropagation()
          const sel = window.getSelection()
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0)
            range.deleteContents()
            const br = document.createElement('br')
            range.insertNode(br)
            range.setStartAfter(br)
            range.setEndAfter(br)
            sel.removeAllRanges()
            sel.addRange(range)

            // Trigger change notification on line break
            if (changeDebounceTimerRef.current) {
              clearTimeout(changeDebounceTimerRef.current)
            }
            changeDebounceTimerRef.current = setTimeout(() => {
              void flushPendingChanges()
            }, 150)
          }
        } else if (e.ctrlKey) {
          // Ctrl + Enter -> create and focus a new paragraph block below
          e.preventDefault()
          e.stopPropagation()

          const editorInstance = editorInstanceRef.current
          if (editorInstance) {
            try {
              const index = editorInstance.blocks.getCurrentBlockIndex()
              editorInstance.blocks.insert('paragraph', { text: '' }, {}, index + 1, true)
              setTimeout(() => {
                try {
                  editorInstance.caret.setToBlock(index + 1, 'start')
                } catch (err) {
                  console.error('Failed to set caret to new block:', err)
                }
              }, 20)
            } catch (err) {
              console.error('Failed to programmatically insert block:', err)
            }
          }
        }
        // Standard Enter is left unintercepted so Editor.js splits blocks, continues checklists, etc.
      }

      // 3. Space shortcut: typing "# ", "## ", "### ", "#### " converts paragraph to heading
      if (e.key === ' ') {
        const sel = window.getSelection()
        if (sel && sel.anchorNode) {
          const anchorEl =
            sel.anchorNode.nodeType === Node.ELEMENT_NODE
              ? (sel.anchorNode as HTMLElement)
              : sel.anchorNode.parentElement
          const paragraphEl = anchorEl?.closest('.ce-paragraph')
          if (paragraphEl) {
            const rawText = (paragraphEl.textContent || '').trim()
            const headingMatch = rawText.match(/^(#{1,6})$/)
            if (headingMatch) {
              e.preventDefault()
              e.stopPropagation()
              const level = headingMatch[1].length
              const editorInstance = editorInstanceRef.current
              if (editorInstance) {
                const index = editorInstance.blocks.getCurrentBlockIndex()
                editorInstance.blocks.delete(index)
                editorInstance.blocks.insert(`heading${level}`, { text: '', level }, {}, index, true)
                setTimeout(() => {
                  try {
                    editorInstance.caret.setToBlock(index, 'end')
                  } catch (err) {
                    console.error('Failed to set caret to heading block:', err)
                  }
                }, 30)
              }
              return
            } else if (rawText === '>') {
              e.preventDefault()
              e.stopPropagation()
              const editorInstance = editorInstanceRef.current
              if (editorInstance) {
                const index = editorInstance.blocks.getCurrentBlockIndex()
                editorInstance.blocks.delete(index)
                editorInstance.blocks.insert('quote', { text: '', caption: '' }, {}, index, true)
                setTimeout(() => {
                  try {
                    editorInstance.caret.setToBlock(index, 'end')
                  } catch (err) {
                    console.error('Failed to set caret to quote block:', err)
                  }
                }, 30)
              }
              return
            } else if (rawText === '-' || rawText === '*') {
              e.preventDefault()
              e.stopPropagation()
              const editorInstance = editorInstanceRef.current
              if (editorInstance) {
                const index = editorInstance.blocks.getCurrentBlockIndex()
                editorInstance.blocks.delete(index)
                editorInstance.blocks.insert(
                  'list',
                  { style: 'unordered', items: [''] },
                  {},
                  index,
                  true
                )
                setTimeout(() => {
                  try {
                    editorInstance.caret.setToBlock(index, 'end')
                  } catch (err) {
                    console.error('Failed to set caret to list block:', err)
                  }
                }, 30)
              }
              return
            } else if (rawText === '[]' || rawText === '[ ]') {
              e.preventDefault()
              e.stopPropagation()
              const editorInstance = editorInstanceRef.current
              if (editorInstance) {
                const index = editorInstance.blocks.getCurrentBlockIndex()
                editorInstance.blocks.delete(index)
                editorInstance.blocks.insert(
                  'checklist',
                  { items: [{ text: '', checked: false }] },
                  {},
                  index,
                  true
                )
                setTimeout(() => {
                  try {
                    editorInstance.caret.setToBlock(index, 'end')
                  } catch (err) {
                    console.error('Failed to set caret to checklist block:', err)
                  }
                }, 30)
              }
              return
            }
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown, true)
    return () => {
      container.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [activeFilePath, handleUndo, handleRedo, flushPendingChanges])

  // Delegated click listener to catch wikilink clicks (both HTML anchors and raw [[Link]] text)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseClick = (e: MouseEvent): void => {
      const target = e.target as HTMLElement
      const wikilinkEl = target.closest('.wikilink')
      if (wikilinkEl) {
        e.preventDefault()
        e.stopPropagation()
        const path = wikilinkEl.getAttribute('data-path')
        if (path && onWikilinkClickRef.current) {
          onWikilinkClickRef.current(path)
        }
        return
      }

      let range: Range | null = null
      const docWithCaret = document as Document & {
        caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
        caretRangeFromPoint?: (x: number, y: number) => Range | null
      }
      if (typeof docWithCaret.caretPositionFromPoint === 'function') {
        const pos = docWithCaret.caretPositionFromPoint(e.clientX, e.clientY)
        if (pos && pos.offsetNode) {
          range = document.createRange()
          range.setStart(pos.offsetNode, pos.offset)
          range.setEnd(pos.offsetNode, pos.offset)
        }
      } else if (typeof docWithCaret.caretRangeFromPoint === 'function') {
        range = docWithCaret.caretRangeFromPoint(e.clientX, e.clientY)
      } else {
        const firefoxEvent = e as MouseEvent & { rangeParent?: Node; rangeOffset?: number }
        if (firefoxEvent.rangeParent !== undefined && firefoxEvent.rangeOffset !== undefined) {
          range = document.createRange()
          range.setStart(firefoxEvent.rangeParent, firefoxEvent.rangeOffset)
        }
      }

      if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
        const textNode = range.startContainer as Text
        const offset = range.startOffset
        const text = textNode.textContent || ''

        let startIdx = -1
        for (let i = offset; i >= 0; i--) {
          if (text[i] === '[' && text[i - 1] === '[') {
            startIdx = i - 1
            break
          }
          if (text[i] === '\n' || text[i] === '\r') break
        }

        if (startIdx !== -1) {
          let endIdx = -1
          for (let i = offset; i < text.length; i++) {
            if (text[i] === ']' && text[i + 1] === ']') {
              endIdx = i + 1
              break
            }
            if (text[i] === '\n' || text[i] === '\r') break
          }

          if (endIdx !== -1 && endIdx > startIdx + 3) {
            const rawTarget = text.substring(startIdx + 2, endIdx - 1).trim()
            if (rawTarget && onWikilinkClickRef.current) {
              e.preventDefault()
              e.stopPropagation()
              onWikilinkClickRef.current(rawTarget)
            }
          }
        }
      }
    }

    container.addEventListener('click', handleMouseClick)
    return () => {
      container.removeEventListener('click', handleMouseClick)
    }
  }, [])

  return <div ref={containerRef} className="block-editor-wrapper" id="editorjs-container" />
}

export default React.memo(BlockEditorComponent)
