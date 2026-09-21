import { useState, useCallback } from 'react'
import { storageService, STORAGE_KEYS } from '../services/storageService'

export interface EditorTypographyConfig {
  fontFamily: string
  fontSize: number
  lineHeight: string
  letterSpacing: string
  paragraphSpacing: string
  fontWeight: string
  textAlign: string
}

export const DEFAULT_TYPOGRAPHY: EditorTypographyConfig = {
  fontFamily: "'Inter', sans-serif",
  fontSize: 15,
  lineHeight: '1.7',
  letterSpacing: 'normal',
  paragraphSpacing: '1.2em',
  fontWeight: '400',
  textAlign: 'left'
}

export interface UseEditorTypographyReturn {
  editorFontFamily: string
  editorFontSize: number
  editorLineHeight: string
  editorLetterSpacing: string
  editorParagraphSpacing: string
  editorFontWeight: string
  editorTextAlign: string
  handleFontFamilyChange: (font: string) => void
  handleFontSizeChange: (size: number) => void
  handleLineHeightChange: (val: string) => void
  handleLetterSpacingChange: (val: string) => void
  handleParagraphSpacingChange: (val: string) => void
  handleFontWeightChange: (val: string) => void
  handleTextAlignChange: (val: string) => void
}

function loadInitialTypography(): EditorTypographyConfig {
  const stored = storageService.getItem<EditorTypographyConfig>(STORAGE_KEYS.EDITOR_TYPOGRAPHY)
  if (stored) {
    return { ...DEFAULT_TYPOGRAPHY, ...stored }
  }

  // Fallback to legacy individual localStorage keys if present
  const legacyFont = storageService.getItem<string>('oink_editor_font_family')
  const legacySize = storageService.getItem<string>('oink_editor_font_size')
  const legacyLineHeight = storageService.getItem<string>('oink_editor_line_height')
  const legacyLetterSpacing = storageService.getItem<string>('oink_editor_letter_spacing')
  const legacyParagraphSpacing = storageService.getItem<string>('oink_editor_paragraph_spacing')
  const legacyFontWeight = storageService.getItem<string>('oink_editor_font_weight')
  const legacyTextAlign = storageService.getItem<string>('oink_editor_text_align')

    return {
      fontFamily: legacyFont || DEFAULT_TYPOGRAPHY.fontFamily,
      fontSize: legacySize ? parseInt(legacySize, 10) : DEFAULT_TYPOGRAPHY.fontSize,
      lineHeight: legacyLineHeight || DEFAULT_TYPOGRAPHY.lineHeight,
      letterSpacing: legacyLetterSpacing || DEFAULT_TYPOGRAPHY.letterSpacing,
      paragraphSpacing: legacyParagraphSpacing || DEFAULT_TYPOGRAPHY.paragraphSpacing,
      fontWeight: legacyFontWeight || DEFAULT_TYPOGRAPHY.fontWeight,
      textAlign: legacyTextAlign || DEFAULT_TYPOGRAPHY.textAlign
    }
}

export function useEditorTypography(): UseEditorTypographyReturn {
  const [config, setConfig] = useState<EditorTypographyConfig>(loadInitialTypography)

  const updateConfig = useCallback((patch: Partial<EditorTypographyConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch }
      storageService.setItem(STORAGE_KEYS.EDITOR_TYPOGRAPHY, next)
      return next
    })
  }, [])

  const handleFontFamilyChange = useCallback((font: string) => {
    updateConfig({ fontFamily: font })
  }, [updateConfig])

  const handleFontSizeChange = useCallback((size: number) => {
    updateConfig({ fontSize: size })
  }, [updateConfig])

  const handleLineHeightChange = useCallback((val: string) => {
    updateConfig({ lineHeight: val })
  }, [updateConfig])

  const handleLetterSpacingChange = useCallback((val: string) => {
    updateConfig({ letterSpacing: val })
  }, [updateConfig])

  const handleParagraphSpacingChange = useCallback((val: string) => {
    updateConfig({ paragraphSpacing: val })
  }, [updateConfig])

  const handleFontWeightChange = useCallback((val: string) => {
    updateConfig({ fontWeight: val })
  }, [updateConfig])

  const handleTextAlignChange = useCallback((val: string) => {
    updateConfig({ textAlign: val })
  }, [updateConfig])

  return {
    editorFontFamily: config.fontFamily,
    editorFontSize: config.fontSize,
    editorLineHeight: config.lineHeight,
    editorLetterSpacing: config.letterSpacing,
    editorParagraphSpacing: config.paragraphSpacing,
    editorFontWeight: config.fontWeight,
    editorTextAlign: config.textAlign,
    handleFontFamilyChange,
    handleFontSizeChange,
    handleLineHeightChange,
    handleLetterSpacingChange,
    handleParagraphSpacingChange,
    handleFontWeightChange,
    handleTextAlignChange
  }
}
