import React, {useState, useRef} from 'react';

export function CopyToClipboardText({text}) {
  const [copied, setCopied] = useState(false);
  const textRef = useRef(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{display: 'inline-flex', alignItems: 'center'}}>
      <span ref={textRef} style={{marginRight: '10px'}}>
        {text}
      </span>
      <button onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
    </div>
  );
}
