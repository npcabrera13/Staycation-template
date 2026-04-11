import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import RichTextToolbar from './RichTextToolbar';

interface InlineTextProps {
    value: string;
    isEditing: boolean;
    onChange: (value: string) => void;
    className?: string;
    multiline?: boolean;
    placeholder?: string;
    toolbarPosition?: 'top' | 'bottom';
}

const InlineText: React.FC<InlineTextProps> = ({
    value,
    isEditing,
    onChange,
    className = '',
    placeholder = 'Enter text...',
    toolbarPosition = 'top'
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const contentRef = useRef<HTMLSpanElement>(null);
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const lastSyncedValue = useRef<string>('');
    // Initial mount style — only used to place the portal on first render.
    // Subsequent scroll/resize updates bypass React state and mutate style directly.
    const [toolbarMounted, setToolbarMounted] = useState(false);
    const computedStyle = useRef<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 300 });

    // ── Save selection so we can restore it when focus re-enters from toolbar ──
    const savedRange = useRef<Range | null>(null);

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedRange.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        if (!savedRange.current) return;
        const sel = window.getSelection();
        if (sel) {
            sel.removeAllRanges();
            sel.addRange(savedRange.current);
        }
    };

    // Use useLayoutEffect to set innerHTML BEFORE browser paints
    useLayoutEffect(() => {
        if (isEditing && contentRef.current) {
            if (!isFocused && lastSyncedValue.current !== value) {
                contentRef.current.innerHTML = value || '';
                lastSyncedValue.current = value || '';
            }
        }
    }, [isEditing, value, isFocused]);

    const setContentRef = useCallback((node: HTMLSpanElement | null) => {
        contentRef.current = node;
        if (node && lastSyncedValue.current !== value) {
            node.innerHTML = value || '';
            lastSyncedValue.current = value || '';
        }
    }, [value]);

    const handleInput = useCallback(() => {
        if (contentRef.current) {
            const html = contentRef.current.innerHTML;
            const cleanHtml = html === '<br>' || html === '<br/>' ? '' : html;
            lastSyncedValue.current = cleanHtml;
            onChange(cleanHtml);
        }
    }, [onChange]);

    const handleFormat = (command: string, arg?: string) => {
        // Restore focus and saved selection so execCommand has something to act on
        if (contentRef.current) {
            contentRef.current.focus();
        }
        restoreSelection();

        // If selection still collapsed after restore, select all text in this block
        const selection = window.getSelection();
        let isCollapsed = true;
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (!range.collapsed && contentRef.current?.contains(range.commonAncestorContainer)) {
                isCollapsed = false;
            }
        }
        if (isCollapsed && contentRef.current) {
            const range = document.createRange();
            range.selectNodeContents(contentRef.current);
            selection?.removeAllRanges();
            selection?.addRange(range);
        }

        if (command === 'fontSizePx' && arg) {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const span = document.createElement('span');
                span.style.fontSize = arg + 'px';
                const content = range.extractContents();
                span.appendChild(content);
                range.insertNode(span);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        } else {
            document.execCommand(command, false, arg);
        }

        handleInput();
        saveSelection();
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = (e: React.FocusEvent) => {
        // Save the current selection whenever we blur so we can restore it later
        saveSelection();

        const relatedTarget = e.relatedTarget as Node | null;
        if (relatedTarget) {
            // Don't close if focus moved within the contentEditable wrapper
            if (wrapperRef.current?.contains(relatedTarget)) return;
            // Don't close if focus moved into the portal toolbar (critical fix!)
            if (toolbarRef.current?.contains(relatedTarget)) return;
        }
        setIsFocused(false);
    };

    // Position toolbar — initially via state (to mount/show it), then directly via DOM ref on scroll.
    useLayoutEffect(() => {
        if (!isFocused || !wrapperRef.current) {
            setToolbarMounted(false);
            return;
        }

        const computePosition = () => {
            if (!wrapperRef.current) return null;
            const rect = wrapperRef.current.getBoundingClientRect();
            const MARGIN = 8;
            const TOOLBAR_HEIGHT = 80;
            const TOOLBAR_WIDTH = Math.min(
                window.innerWidth < 768 ? window.innerWidth - MARGIN * 2 : 700,
                window.innerWidth - MARGIN * 2
            );

            const spaceAbove = rect.top - MARGIN;
            const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
            const openAbove = spaceAbove >= TOOLBAR_HEIGHT || spaceAbove >= spaceBelow;

            const top = openAbove
                ? Math.max(MARGIN, rect.top - TOOLBAR_HEIGHT - 6)
                : Math.min(window.innerHeight - TOOLBAR_HEIGHT - MARGIN, rect.bottom + 6);

            const idealLeft = rect.left + rect.width / 2 - TOOLBAR_WIDTH / 2;
            const left = Math.max(MARGIN, Math.min(idealLeft, window.innerWidth - TOOLBAR_WIDTH - MARGIN));

            return { top, left, width: TOOLBAR_WIDTH };
        };

        // Initial placement: set state to mount the portal with correct position
        const initial = computePosition();
        if (initial) {
            computedStyle.current = initial;
            setToolbarMounted(true);
        }

        // Scroll/resize: directly mutate the DOM element — no React re-render, no frame lag
        const updateDirect = () => {
            const pos = computePosition();
            if (!pos || !toolbarRef.current) return;
            toolbarRef.current.style.top = pos.top + 'px';
            toolbarRef.current.style.left = pos.left + 'px';
            toolbarRef.current.style.width = pos.width + 'px';
        };

        window.addEventListener('scroll', updateDirect, { capture: true, passive: true });
        window.addEventListener('resize', updateDirect, { passive: true });
        return () => {
            window.removeEventListener('scroll', updateDirect, true);
            window.removeEventListener('resize', updateDirect);
        };
    }, [isFocused]);

    if (!isEditing) {
        return (
            <span
                className={className}
                dangerouslySetInnerHTML={{ __html: value || placeholder }}
            />
        );
    }

    return (
        <span
            ref={wrapperRef}
            className="relative inline-block w-full hover:z-[40] focus-within:z-[50]"
            onClick={(e) => e.stopPropagation()}
            onBlurCapture={handleBlur}
        >
            {/* Portal: render toolbar into document.body to escape stacking contexts */}
            {isFocused && toolbarMounted && createPortal(
                <div
                    ref={toolbarRef}
                    className="animate-fade-in-up"
                    style={{
                        position: 'fixed',
                        top: computedStyle.current.top,
                        left: computedStyle.current.left,
                        width: computedStyle.current.width,
                        zIndex: 9999,
                    }}
                >
                    <RichTextToolbar
                        onFormat={handleFormat}
                        className="w-full shadow-2xl"
                    />
                </div>,
                document.body
            )}

            <span
                ref={setContentRef}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={handleInput}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onMouseUp={saveSelection}
                onKeyUp={saveSelection}
                className={`outline-none border-2 border-dashed ${isFocused ? 'border-blue-500 bg-white/10' : 'border-gray-400/50'} hover:border-gray-400 rounded px-2 min-w-[50px] transition-all cursor-text flex-1 ${className}`}
                style={{ minHeight: '1.5em', display: 'inline-block' }}
                data-placeholder={placeholder}
            />
        </span>
    );
};

export default InlineText;
