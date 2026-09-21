import React from 'react'
import { ChevronLeft, Minus, Plus, AlignLeft, AlignCenter, AlignJustify } from 'lucide-react'

interface PageActionTypographyViewProps {
  editorFontSize: number
  onChangeFontSize: (size: number) => void
  editorLineHeight?: string
  onChangeLineHeight?: (height: string) => void
  editorLetterSpacing?: string
  onChangeLetterSpacing?: (spacing: string) => void
  editorParagraphSpacing?: string
  onChangeParagraphSpacing?: (spacing: string) => void
  editorFontWeight?: string
  onChangeFontWeight?: (weight: string) => void
  editorTextAlign?: string
  onChangeTextAlign?: (align: string) => void
  onBack: () => void
}

function PageActionTypographyViewComponent({
  editorFontSize,
  onChangeFontSize,
  editorLineHeight = '1.7',
  onChangeLineHeight,
  editorLetterSpacing = 'normal',
  onChangeLetterSpacing,
  editorParagraphSpacing = '1.2em',
  onChangeParagraphSpacing,
  editorFontWeight = '400',
  onChangeFontWeight,
  editorTextAlign = 'left',
  onChangeTextAlign,
  onBack
}: PageActionTypographyViewProps): React.JSX.Element {
  return (
    <div className="text-customization-view flex flex-col gap-1">
      {/* Back Navigation Header */}
      <div className="font-chooser-header">
        <button
          type="button"
          className="font-chooser-back-btn"
          onClick={onBack}
          title="Back to options"
        >
          <ChevronLeft size={14} />
          <span>Text Customisation</span>
        </button>
      </div>

      {/* 1. Font Size Control */}
      <div className="page-actions-section-title flex items-center justify-between">
        <span>Font Size</span>
        <span className="font-mono text-zinc-400 font-normal text-[11px]">{editorFontSize}px</span>
      </div>

      <div className="typography-segmented-bar">
        <button
          type="button"
          className="typography-stepper-btn"
          onClick={(): void => onChangeFontSize(Math.max(10, editorFontSize - 1))}
          title="Decrease font size"
        >
          <Minus size={11} />
        </button>
        {[13, 15, 17, 19].map((sz) => (
          <button
            key={sz}
            type="button"
            className={`typography-segment-btn ${editorFontSize === sz ? 'active' : ''}`}
            onClick={(): void => onChangeFontSize(sz)}
          >
            {sz}px
          </button>
        ))}
        <button
          type="button"
          className="typography-stepper-btn"
          onClick={(): void => onChangeFontSize(Math.min(36, editorFontSize + 1))}
          title="Increase font size"
        >
          <Plus size={11} />
        </button>
      </div>

      <div className="typography-slider-wrap">
        <input
          type="range"
          min="10"
          max="36"
          step="1"
          value={editorFontSize}
          onChange={(e): void => onChangeFontSize(parseInt(e.target.value, 10))}
          className="typography-slider"
        />
      </div>

      {/* Divider */}
      <div className="page-actions-divider my-1" />

      {/* 2. Line Spacing (Line Height) */}
      {onChangeLineHeight && (
        <>
          <div className="page-actions-section-title flex items-center justify-between">
            <span>Line Spacing</span>
            <span className="text-zinc-400 font-normal text-[11px]">
              {editorLineHeight === '1.4'
                ? 'Compact'
                : editorLineHeight === '2.0'
                  ? 'Relaxed'
                  : 'Normal'}
            </span>
          </div>

          <div className="typography-segmented-bar">
            {[
              { val: '1.4', label: 'Compact' },
              { val: '1.7', label: 'Normal' },
              { val: '2.0', label: 'Relaxed' }
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                className={`typography-segment-btn ${editorLineHeight === item.val ? 'active' : ''}`}
                onClick={(): void => onChangeLineHeight(item.val)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="page-actions-divider my-1" />
        </>
      )}

      {/* 3. Font Weight */}
      {onChangeFontWeight && (
        <>
          <div className="page-actions-section-title">Font Weight</div>

          <div className="typography-segmented-bar">
            {[
              { val: '300', label: 'Light' },
              { val: '400', label: 'Regular' },
              { val: '600', label: 'Medium' },
              { val: '700', label: 'Bold' }
            ].map((w) => (
              <button
                key={w.val}
                type="button"
                className={`typography-segment-btn ${editorFontWeight === w.val ? 'active' : ''}`}
                onClick={(): void => onChangeFontWeight(w.val)}
              >
                {w.label}
              </button>
            ))}
          </div>

          <div className="page-actions-divider my-1" />
        </>
      )}

      {/* 4. Text Alignment */}
      {onChangeTextAlign && (
        <>
          <div className="page-actions-section-title">Alignment</div>

          <div className="typography-segmented-bar">
            {[
              { val: 'left', label: 'Left', icon: AlignLeft },
              { val: 'center', label: 'Center', icon: AlignCenter },
              { val: 'justify', label: 'Justify', icon: AlignJustify }
            ].map((a) => {
              const Icon = a.icon
              return (
                <button
                  key={a.val}
                  type="button"
                  className={`typography-segment-btn flex items-center justify-center gap-1.5 ${editorTextAlign === a.val ? 'active' : ''}`}
                  onClick={(): void => onChangeTextAlign(a.val)}
                  title={a.label}
                >
                  <Icon size={12} strokeWidth={1.75} />
                  <span>{a.label}</span>
                </button>
              )
            })}
          </div>

          <div className="page-actions-divider my-1" />
        </>
      )}

      {/* 5. Letter Spacing */}
      {onChangeLetterSpacing && (
        <>
          <div className="page-actions-section-title flex items-center justify-between">
            <span>Letter Spacing</span>
            <span className="text-zinc-400 font-normal text-[11px]">
              {editorLetterSpacing === '-0.02em'
                ? 'Tight'
                : editorLetterSpacing === '0.04em'
                  ? 'Wide'
                  : 'Normal'}
            </span>
          </div>

          <div className="typography-segmented-bar">
            {[
              { val: '-0.02em', label: 'Tight' },
              { val: 'normal', label: 'Normal' },
              { val: '0.04em', label: 'Wide' }
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                className={`typography-segment-btn ${editorLetterSpacing === item.val ? 'active' : ''}`}
                onClick={(): void => onChangeLetterSpacing(item.val)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="page-actions-divider my-1" />
        </>
      )}

      {/* 6. Paragraph Spacing */}
      {onChangeParagraphSpacing && (
        <>
          <div className="page-actions-section-title flex items-center justify-between">
            <span>Paragraph Spacing</span>
            <span className="text-zinc-400 font-normal text-[11px]">
              {editorParagraphSpacing === '0.8em'
                ? 'Compact'
                : editorParagraphSpacing === '1.8em'
                  ? 'Relaxed'
                  : 'Normal'}
            </span>
          </div>

          <div className="typography-segmented-bar">
            {[
              { val: '0.8em', label: 'Compact' },
              { val: '1.2em', label: 'Normal' },
              { val: '1.8em', label: 'Relaxed' }
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                className={`typography-segment-btn ${editorParagraphSpacing === item.val ? 'active' : ''}`}
                onClick={(): void => onChangeParagraphSpacing(item.val)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default React.memo(PageActionTypographyViewComponent)
