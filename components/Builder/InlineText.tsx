import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
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
    const lastSyncedValue = useRef<string>('');

    // Use useLayoutEffect to set innerHTML BEFORE browser paints
    // This runs synchronously after DOM mutations
    useLayoutEffect(() => {
        if (isEditing && contentRef.current) {
            // Only update innerHTML if value changed and we're not focused
            // (to prevent cursor jumping while typing)
            if (!isFocused && lastSyncedValue.current !== value) {
                contentRef.current.innerHTML = value || '';
                lastSyncedValue.current = value || '';
            }
        }
    }, [isEditing, value, isFocused]);

    // Also set initial innerHTML when the ref first attaches
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
            // Clean up: if html is just <br> or empty, treat as empty string
            const cleanHtml = html === '<br>' || html === '<br/>' ? '' : html;
            lastSyncedValue.current = cleanHtml; // Track what we have
            onChange(cleanHtml);
        }
    }, [onChange]);

    const handleFormat = (command: string, arg?: string) => {
        if (contentRef.current) {
            contentRef.current.focus();
        }

        if (command === 'fontSizePx' && arg) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const span = document.createElement('span');
                span.style.fontSize = arg + 'px';
                const content = range.extractContents();
                span.appendChild(content);
                range.insertNode(span);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } else {
            document.execCommand(command, false, arg);
        }

        handleInput();
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = (e: React.FocusEvent) => {
        if (
            e.relatedTarget &&
            wrapperRef.current &&
            wrapperRef.current.contains(e.relatedTarget as Node)
        ) {
            return;
        }
        setIsFocused(false);
    };

    // View mode - just display the value
    if (!isEditing) {
        return (
            <span
                className={className}
                dangerouslySetInnerHTML={{ __html: value || placeholder }}
            />
        );
    }

    // Edit mode - use span elements to avoid HTML nesting errors (div inside p)
    return (
        <span
            ref={wrapperRef}
            className="relative inline-block w-full"
            onClick={(e) => e.stopPropagation()}
            onBlurCapture={handleBlur}
        >
            {isFocused && (
                <span
                    className={`absolute ${toolbarPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} right-0 md:left-1/2 md:-translate-x-1/2 md:right-auto z-[100] flex justify-end md:justify-center animate-fade-in-up md:w-max min-w-[280px]`}
                >
                    <RichTextToolbar
                        onFormat={handleFormat}
                        className="w-full md:w-max max-w-[90vw] md:max-w-[800px] overflow-visible shadow-2xl"
                    />
                </span>
            )}

            <span
                ref={setContentRef}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={handleInput}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={`outline-none border-2 border-dashed ${isFocused ? 'border-primary bg-white/10' : 'border-accent/30'} hover:border-accent rounded px-2 min-w-[50px] transition-all cursor-text ${className}`}
                style={{ minHeight: '1.5em', display: 'inline-block' }}
                data-placeholder={placeholder}
            />
        </span>
    );
};

export default InlineText;
