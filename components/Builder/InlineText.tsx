import React, { useState, useEffect, useRef } from 'react';
import RichTextToolbar from './RichTextToolbar';

interface InlineTextProps {
    value: string;
    isEditing: boolean;
    onChange: (value: string) => void;
    className?: string;
    multiline?: boolean;
    placeholder?: string;
}

const InlineText: React.FC<InlineTextProps> = ({
    value,
    isEditing,
    onChange,
    className = '',
    placeholder = 'Enter text...'
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Sync content when value changes externally (and not currently editing effectively)
    useEffect(() => {
        if (contentRef.current) {
            // If the element is NOT focused, we sync.
            // If it IS focused, we usually trust the user's input, UNLESS value changed drastically from outside?
            // But for simple text editing, only sync when not focused prevents the "backward typing" (caret reset) issue.
            if (document.activeElement !== contentRef.current) {
                if (contentRef.current.innerHTML !== value) {
                    contentRef.current.innerHTML = value; // Don't enforce placeholder in value logic here to avoid ghost text saving?
                    // Actually, if value is empty, user wants to see placeholder?
                    // Let's handle placeholder via CSS empty pseudo-class ideally.
                    if (!value && placeholder) {
                        // We can't easily put placeholder in innerHTML without it becoming value.
                        // We'll rely on CSS 'empty:before' or similar.
                    }
                }
            }
        }
    }, [value, placeholder]);

    const handleInput = () => {
        if (contentRef.current) {
            const html = contentRef.current.innerHTML;
            // If html is just <br> or empty, set to empty string
            const cleanHtml = html === '<br>' ? '' : html;
            onChange(cleanHtml);
        }
    };

    const handleFormat = (command: string, arg?: string) => {
        if (command === 'fontSizePx' && arg) {
            // Custom font size handling
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const span = document.createElement('span');
                span.style.fontSize = arg + 'px';

                // Extract contents and wrap
                const content = range.extractContents();
                span.appendChild(content);
                range.insertNode(span);

                // Cleanup empty spans if needed? Simple wrap for now.
                // Reselect
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } else {
            document.execCommand(command, false, arg);
        }

        if (contentRef.current) {
            contentRef.current.focus(); // Keep focus
        }
    };

    const wrapperRef = useRef<HTMLDivElement>(null);

    // ... useEffect ...

    const handleBlur = (e: React.FocusEvent) => {
        // Prevent hiding toolbar if focus moves to something inside our wrapper (like the toolbar buttons/select)
        if (
            e.relatedTarget &&
            wrapperRef.current &&
            wrapperRef.current.contains(e.relatedTarget as Node)
        ) {
            return;
        }
        setIsFocused(false);
    };

    if (!isEditing) {
        return (
            <span
                className={className}
                dangerouslySetInnerHTML={{ __html: value || placeholder }} // Keep placeholder logic for View Mode
            />
        );
    }

    return (
        <div
            ref={wrapperRef}
            className="relative inline-block w-full"
            onClick={(e) => e.stopPropagation()}
            onBlurCapture={handleBlur}
        >
            {isFocused && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] p-2 flex justify-center md:absolute md:top-auto md:bottom-full md:left-0 md:right-auto md:p-0 md:mb-2 animate-fade-in-up">
                    <RichTextToolbar
                        onFormat={handleFormat}
                        className="w-full md:w-auto overflow-x-auto"
                    />
                </div>
            )}

            <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                className={`outline-none border-2 border-dashed ${isFocused ? 'border-primary bg-white/10' : 'border-accent/30'} hover:border-accent rounded px-2 min-w-[50px] transition-all cursor-text ${className} empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400`}
                style={{ minHeight: '1.5em', display: 'inline-block' }}
                data-placeholder={placeholder}
            />
        </div>
    );
};

export default InlineText;
