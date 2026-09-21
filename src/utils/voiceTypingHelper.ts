/**
 * Voice Typing Helper for EditorJS
 *
 * Provides real-time direct speech typing directly into EditorJS blocks:
 * - Directly prints spoken words into the editor with bright text first.
 * - Transitions smoothly to the standard text color 0.5s later.
 * - Rock-solid caret preservation, zero line deletions, and smart punctuation attachment.
 */

import {
  VoiceCommand,
  shouldPrependSpace,
  isPunctuationChar,
  PunctuationSubstitution
} from './punctuationEngine'

// Track last substituted punctuation for quick conversion back to words
let lastPunctuationSubstitution: PunctuationSubstitution | null = null

// Track last known valid selection range within EditorJS container
let lastSavedRange: Range | null = null

// Active streaming span reference for live interim speech
let activeStreamingSpan: HTMLSpanElement | null = null

interface SettlingTimers {
  fadeTimer: number | null
  unwrapTimer: number | null
}

// Per-span timer tracking to prevent rapid speech from canceling unwrap timers of earlier spans
const spanTimersMap = new WeakMap<HTMLSpanElement, SettlingTimers>()

/**
 * Schedules a span to transition from bright text (no glow) to normal text color 0.5s later,
 * then cleanly unwraps into a plain text node and normalizes adjacent text nodes.
 */
function scheduleSpanSettling(span: HTMLSpanElement): void {
  // Clear any existing timers for THIS specific span
  const existing = spanTimersMap.get(span)
  if (existing) {
    if (existing.fadeTimer !== null) clearTimeout(existing.fadeTimer)
    if (existing.unwrapTimer !== null) clearTimeout(existing.unwrapTimer)
  }

  const timers: SettlingTimers = {
    fadeTimer: null,
    unwrapTimer: null
  }
  spanTimersMap.set(span, timers)

  // Exactly 500ms (0.5s) later, transition from bright to normal text color
  timers.fadeTimer = window.setTimeout(() => {
    timers.fadeTimer = null
    if (!span.isConnected) return

    span.classList.remove('voice-streaming-bright')
    span.classList.add('voice-streaming-settled')

    // After the 0.5s CSS transition finishes, unwrap into a clean text node
    timers.unwrapTimer = window.setTimeout(() => {
      timers.unwrapTimer = null
      spanTimersMap.delete(span)
      if (!span.isConnected) return
      const parent = span.parentNode
      if (!parent) return

      const text = span.textContent || ''
      const textNode = document.createTextNode(text)

      const sel = window.getSelection()
      const isCaretNearSpan =
        sel &&
        sel.rangeCount > 0 &&
        (sel.focusNode === span ||
          sel.focusNode === parent ||
          sel.focusNode?.parentElement === parent)

      parent.replaceChild(textNode, span)

      // Cleanly normalize to merge fragmented adjacent text nodes
      try {
        parent.normalize()
      } catch {
        // ignore normalize errors on detached elements
      }

      // Re-establish clean collapsed range after unwrapping
      try {
        const newRange = document.createRange()
        newRange.selectNodeContents(parent)
        newRange.collapse(false)
        if (sel && isCaretNearSpan) {
          sel.removeAllRanges()
          sel.addRange(newRange)
        }
        lastSavedRange = newRange.cloneRange()
      } catch {
        // ignore
      }

      // Notify EditorJS via synthetic InputEvent so EditorJS updates its internal data model
      const block =
        parent.nodeType === Node.ELEMENT_NODE
          ? (parent as HTMLElement).closest('[contenteditable="true"]')
          : parent.parentElement?.closest('[contenteditable="true"]')
      if (block) {
        block.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: text
          })
        )
      }
    }, 550)
  }, 500)
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const container = document.querySelector('#editorjs-container')
    if (!container) return

    const range = sel.getRangeAt(0)
    const node = range.startContainer
    const isInsideEditor =
      node.nodeType === Node.ELEMENT_NODE
        ? container.contains(node as HTMLElement)
        : Boolean(node.parentElement && container.contains(node.parentElement))

    if (isInsideEditor) {
      try {
        lastSavedRange = range.cloneRange()
      } catch {
        // ignore clone error
      }
    }
  })

  // Settle active streaming span if user clicks or focuses elsewhere
  document.addEventListener('mousedown', (e) => {
    if (activeStreamingSpan && activeStreamingSpan.isConnected) {
      const target = e.target as Node
      if (!activeStreamingSpan.contains(target)) {
        scheduleSpanSettling(activeStreamingSpan)
        activeStreamingSpan = null
      }
    }
  })
}

/**
 * Recursively gets the last character of a DOM node (text or element).
 */
function getNodeLastCharacter(node: Node): string | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || ''
    return text.length > 0 ? text.slice(-1) : null
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement
    if (el.tagName === 'BR') return '\n'
    // Inspect children in reverse order (right-to-left)
    for (let i = el.childNodes.length - 1; i >= 0; i--) {
      const char = getNodeLastCharacter(el.childNodes[i])
      if (char !== null) return char
    }
    const text = el.textContent || ''
    return text.length > 0 ? text.slice(-1) : null
  }
  return null
}

/**
 * Gets the character immediately before a given (container, offset) caret position,
 * correctly traversing text nodes, element children, and parent trees.
 */
function getCharacterBeforePosition(container: Node, offset: number): string | null {
  if (container.nodeType === Node.TEXT_NODE) {
    const text = container.textContent || ''
    if (offset > 0) {
      return text[offset - 1]
    }
    // Offset is 0: look at previous siblings or walk up
    let curr: Node | null = container
    while (curr) {
      let prev: Node | null = curr.previousSibling
      while (prev) {
        const char = getNodeLastCharacter(prev)
        if (char !== null) return char
        prev = prev.previousSibling
      }
      curr = curr.parentNode
      if (
        !curr ||
        (curr.nodeType === Node.ELEMENT_NODE && (curr as HTMLElement).isContentEditable)
      ) {
        break
      }
    }
    return null
  }

  if (container.nodeType === Node.ELEMENT_NODE) {
    // In an Element node, offset is child index
    if (offset > 0) {
      for (let i = Math.min(offset - 1, container.childNodes.length - 1); i >= 0; i--) {
        const child = container.childNodes[i]
        if (child) {
          const char = getNodeLastCharacter(child)
          if (char !== null) return char
        }
      }
    }
    // If offset is 0 or no character found in preceding children, look before this container
    let curr: Node | null = container
    while (curr) {
      let prev: Node | null = curr.previousSibling
      while (prev) {
        const char = getNodeLastCharacter(prev)
        if (char !== null) return char
        prev = prev.previousSibling
      }
      curr = curr.parentNode
      if (
        !curr ||
        (curr.nodeType === Node.ELEMENT_NODE && (curr as HTMLElement).isContentEditable)
      ) {
        break
      }
    }
    return null
  }

  return null
}

/**
 * Gets the character immediately preceding the caret in the editor selection.
 */
function getPrecedingCharacter(): string | null {
  const sel = window.getSelection()
  let range: Range | null = null

  if (sel && sel.rangeCount > 0) {
    const currentRange = sel.getRangeAt(0)
    const container = document.querySelector('#editorjs-container')
    if (container) {
      const node = currentRange.startContainer
      const isInside =
        node.nodeType === Node.ELEMENT_NODE
          ? container.contains(node as HTMLElement)
          : Boolean(node.parentElement && container.contains(node.parentElement))
      if (isInside && currentRange.collapsed) {
        range = currentRange
      }
    }
  }

  if (!range && lastSavedRange && lastSavedRange.collapsed) {
    range = lastSavedRange
  }

  if (!range) return null
  return getCharacterBeforePosition(range.startContainer, range.startOffset)
}

/**
 * Ensures a contenteditable block in EditorJS is focused and has a valid collapsed caret.
 * Never leaves an entire block selected so subsequent text/commands never wipe out lines.
 */
export function ensureEditorFocus(): HTMLElement | null {
  const container = document.querySelector('#editorjs-container')
  if (!container) return null

  // 1. If currently active element is already a contenteditable block in the editor, preserve it
  const activeEl = document.activeElement as HTMLElement | null
  if (activeEl && container.contains(activeEl) && activeEl.isContentEditable) {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      return activeEl
    }
  }

  // 2. If we have a saved range from previous typing/clicking, restore it safely
  if (lastSavedRange) {
    const containerNode = lastSavedRange.startContainer
    const block =
      containerNode.nodeType === Node.ELEMENT_NODE
        ? (containerNode as HTMLElement).closest('[contenteditable="true"]')
        : containerNode.parentElement?.closest('[contenteditable="true"]')

    if (block && container.contains(block)) {
      ;(block as HTMLElement).focus()
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(lastSavedRange)
        return block as HTMLElement
      }
    }
  }

  // 3. Fallback: focus the last available contenteditable block and place collapsed caret at the very end
  const editables = container.querySelectorAll<HTMLElement>('[contenteditable="true"]')
  if (editables.length === 0) return null

  const target = editables[editables.length - 1]
  target.focus()

  const sel = window.getSelection()
  if (sel) {
    const range = document.createRange()
    range.selectNodeContents(target)
    range.collapse(false) // Strictly collapse to the end so nothing is selected!
    sel.removeAllRanges()
    sel.addRange(range)
    lastSavedRange = range.cloneRange()
  }

  return target
}

/**
 * Inserts a soft line break (<br>) at the current selection caret.
 */
export function insertSoftLineBreak(): void {
  cancelLiveInterimText()

  const activeBlock = ensureEditorFocus()
  if (!activeBlock) return

  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return

  const range = sel.getRangeAt(0)
  range.deleteContents()

  const br = document.createElement('br')
  range.insertNode(br)
  range.setStartAfter(br)
  range.setEndAfter(br)
  sel.removeAllRanges()
  sel.addRange(range)
  lastSavedRange = range.cloneRange()

  // Dispatch dedicated oink:new-line event for native editor handling
  window.dispatchEvent(new CustomEvent('oink:new-line'))

  // Dispatch input event to notify EditorJS of changes
  activeBlock.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertLineBreak'
    })
  )
}

/**
 * Triggers creation of a new paragraph block below the active block.
 */
export function createNewParagraphBlock(): void {
  cancelLiveInterimText()

  ensureEditorFocus()

  // Dispatch first-class oink:new-paragraph event for native Editor.js block insertion
  window.dispatchEvent(new CustomEvent('oink:new-paragraph'))
}

/**
 * Directly prints interim spoken speech into the active EditorJS block in bright text (no glow).
 */
export function updateLiveInterimText(interimText?: string): void {
  if (!interimText || !interimText.trim()) return

  if (activeStreamingSpan && !activeStreamingSpan.isConnected) {
    activeStreamingSpan = null
  }

  if (!activeStreamingSpan) {
    const activeBlock = ensureEditorFocus()
    if (!activeBlock) return

    const preceding = getPrecedingCharacter()
    const needsSpace = shouldPrependSpace(preceding, interimText)

    const span = document.createElement('span')
    span.className = 'voice-streaming-bright'
    span.dataset.needsLeadingSpace = needsSpace ? 'true' : 'false'
    span.textContent = needsSpace ? ` ${interimText}` : interimText

    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      range.collapse(false)
      range.insertNode(span)
      range.setStartAfter(span)
      range.setEndAfter(span)
      sel.removeAllRanges()
      sel.addRange(range)
      lastSavedRange = range.cloneRange()
    }
    activeStreamingSpan = span
  } else {
    const needsSpace = activeStreamingSpan.dataset.needsLeadingSpace === 'true'
    activeStreamingSpan.textContent = needsSpace ? ` ${interimText}` : interimText
    activeStreamingSpan.className = 'voice-streaming-bright'

    const sel = window.getSelection()
    if (sel) {
      const range = document.createRange()
      range.setStartAfter(activeStreamingSpan)
      range.setEndAfter(activeStreamingSpan)
      sel.removeAllRanges()
      sel.addRange(range)
      lastSavedRange = range.cloneRange()
    }
  }
}

/**
 * Cancels active interim streaming and cleanly removes any uncommitted interim text from the document.
 */
export function cancelLiveInterimText(): void {
  if (activeStreamingSpan) {
    const existing = spanTimersMap.get(activeStreamingSpan)
    if (existing) {
      if (existing.fadeTimer !== null) clearTimeout(existing.fadeTimer)
      if (existing.unwrapTimer !== null) clearTimeout(existing.unwrapTimer)
      spanTimersMap.delete(activeStreamingSpan)
    }
    if (activeStreamingSpan.parentNode) {
      activeStreamingSpan.parentNode.removeChild(activeStreamingSpan)
    }
    activeStreamingSpan = null
  }
}

/**
 * Commits finalized formatted text directly into the editor:
 * - Appears bright first (no glow).
 * - Transitions to standard text color 0.5s later.
 * - Always starts with a gap after a pause or full stop.
 * - Completely avoids deleting lines when punctuation marks ("full stop", "comma", etc.) arrive.
 */
export function commitSpokenText(
  text: string,
  substitutions?: PunctuationSubstitution[]
): void {
  if (!text) {
    cancelLiveInterimText()
    return
  }

  if (substitutions && substitutions.length > 0) {
    lastPunctuationSubstitution = substitutions[substitutions.length - 1]
    window.dispatchEvent(
      new CustomEvent('oink:punctuation-substituted', {
        detail: lastPunctuationSubstitution
      })
    )
  }

  const trimmedText = text.trim()
  const startsWithPunctuation = isPunctuationChar(trimmedText[0])

  if (activeStreamingSpan && activeStreamingSpan.isConnected) {
    const spanToSettle = activeStreamingSpan
    activeStreamingSpan = null // DETACH immediately so next speech will NEVER overwrite this!

    // Verify whether a leading space is needed
    let needsSpace = spanToSettle.dataset.needsLeadingSpace === 'true'
    if (!needsSpace && !startsWithPunctuation) {
      const parent = spanToSettle.parentNode
      if (parent) {
        const index = Array.prototype.indexOf.call(parent.childNodes, spanToSettle)
        const charBefore = index > 0 ? getCharacterBeforePosition(parent, index) : null
        if (shouldPrependSpace(charBefore, trimmedText)) {
          needsSpace = true
        }
      }
    }

    const textToSet = !needsSpace || startsWithPunctuation ? trimmedText : ` ${trimmedText}`
    spanToSettle.textContent = textToSet

    const sel = window.getSelection()
    if (sel) {
      const range = document.createRange()
      range.setStartAfter(spanToSettle)
      range.setEndAfter(spanToSettle)
      sel.removeAllRanges()
      sel.addRange(range)
      lastSavedRange = range.cloneRange()
    }

    scheduleSpanSettling(spanToSettle)
    return
  }

  // Fallback if no active streaming span exists (e.g. standalone punctuation mark spoken after pause)
  const activeElement = ensureEditorFocus()
  if (!activeElement) return

  const preceding = getPrecedingCharacter()

  // If text is punctuation (e.g. "." from "full stop"), remove preceding space if present
  if (startsWithPunctuation && (preceding === ' ' || preceding === '\u00A0')) {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
      try {
        sel.modify('extend', 'backward', 'character')
        if (/^[\s\u00A0]$/.test(sel.toString())) {
          document.execCommand('delete')
        } else {
          sel.collapseToEnd()
        }
      } catch {
        // ignore
      }
    }
  }

  const precAfter = getPrecedingCharacter()
  const needsSpace = shouldPrependSpace(precAfter, trimmedText)
  const textToInsert = !needsSpace || startsWithPunctuation ? trimmedText : ` ${trimmedText}`

  const span = document.createElement('span')
  span.className = 'voice-streaming-bright'
  span.textContent = textToInsert

  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0)
    range.collapse(false)
    range.insertNode(span)
    range.setStartAfter(span)
    range.setEndAfter(span)
    sel.removeAllRanges()
    sel.addRange(range)
    lastSavedRange = range.cloneRange()
  }

  scheduleSpanSettling(span)
}

/**
 * Inserts formatted text into the active EditorJS block.
 */
export function insertSpokenText(text: string): void {
  commitSpokenText(text)
}

/**
 * Reverts the most recent punctuation substitution back to its spoken literal word.
 * For example, if "full stop" was converted to ".", this converts "." back to "full stop".
 */
export function convertLastPunctuationToWord(): boolean {
  if (!lastPunctuationSubstitution) return false

  const { symbol, spokenPhrase } = lastPunctuationSubstitution

  // 1. If an active streaming span exists and contains the symbol, replace it
  if (activeStreamingSpan && activeStreamingSpan.isConnected) {
    const current = activeStreamingSpan.textContent || ''
    if (current.includes(symbol)) {
      activeStreamingSpan.textContent = current
        .replace(symbol, ` ${spokenPhrase} `)
        .replace(/\s+/g, ' ')
      lastPunctuationSubstitution = null
      window.dispatchEvent(new CustomEvent('oink:punctuation-converted'))
      return true
    }
  }

  // 2. Check the active contenteditable block in EditorJS
  const activeElement = ensureEditorFocus()
  if (!activeElement) {
    lastPunctuationSubstitution = null
    window.dispatchEvent(new CustomEvent('oink:punctuation-converted'))
    return false
  }

  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0)
    const node = range.startContainer

    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text
      const text = textNode.nodeValue || ''
      const offset = range.startOffset

      const beforeCursor = text.slice(0, offset)
      const symIdx = beforeCursor.lastIndexOf(symbol)
      if (symIdx !== -1 && offset - (symIdx + symbol.length) <= 3) {
        const replaced =
          beforeCursor.slice(0, symIdx) +
          ` ${spokenPhrase} ` +
          beforeCursor.slice(symIdx + symbol.length)
        const newFullText = (replaced + text.slice(offset)).replace(/\s+/g, ' ')
        textNode.nodeValue = newFullText

        const newOffset = replaced.replace(/\s+/g, ' ').length
        const newRange = document.createRange()
        newRange.setStart(textNode, Math.min(newOffset, (textNode.nodeValue || '').length))
        newRange.collapse(true)
        sel.removeAllRanges()
        sel.addRange(newRange)
        lastSavedRange = newRange.cloneRange()

        activeElement.dispatchEvent(
          new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText' })
        )
        lastPunctuationSubstitution = null
        window.dispatchEvent(new CustomEvent('oink:punctuation-converted'))
        return true
      }
    }

    // Fallback: search backwards with caret modification
    try {
      sel.modify('extend', 'backward', 'character')
      if (sel.toString().trim() === symbol || sel.toString().includes(symbol)) {
        document.execCommand('insertText', false, ` ${spokenPhrase} `)
        lastPunctuationSubstitution = null
        window.dispatchEvent(new CustomEvent('oink:punctuation-converted'))
        return true
      }
    } catch {
      // ignore
    }
  }

  lastPunctuationSubstitution = null
  window.dispatchEvent(new CustomEvent('oink:punctuation-converted'))
  return false
}

export function getLastPunctuationSubstitution(): PunctuationSubstitution | null {
  return lastPunctuationSubstitution
}

export function clearLastPunctuationSubstitution(): void {
  lastPunctuationSubstitution = null
}

/**
 * Executes extracted voice commands (new paragraph, new line, scratch that, convert-to-word).
 */
export function executeVoiceCommands(commands: VoiceCommand[]): void {
  for (const cmd of commands) {
    if (cmd.type === 'scratch-that') {
      if (activeStreamingSpan && activeStreamingSpan.parentNode) {
        activeStreamingSpan.parentNode.removeChild(activeStreamingSpan)
        activeStreamingSpan = null
      }
      window.dispatchEvent(new CustomEvent('oink:undo'))
    } else if (cmd.type === 'new-paragraph') {
      createNewParagraphBlock()
    } else if (cmd.type === 'new-line') {
      insertSoftLineBreak()
    } else if (cmd.type === 'clear-block') {
      if (activeStreamingSpan && activeStreamingSpan.parentNode) {
        activeStreamingSpan.parentNode.removeChild(activeStreamingSpan)
        activeStreamingSpan = null
      }
      window.dispatchEvent(new CustomEvent('oink:clear-block'))
    } else if (cmd.type === 'convert-to-word') {
      convertLastPunctuationToWord()
    }
  }
}
