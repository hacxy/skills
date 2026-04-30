import { useEffect, useState } from "react";

interface Props {
  skillName: string;
}

export function TerminalAnimation({ skillName }: Props) {
  const command = `npx @hacxy/skills install ${skillName}`;
  const [typed, setTyped] = useState(0);
  const [showLine1, setShowLine1] = useState(false);
  const [showLine2, setShowLine2] = useState(false);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    setTyped(0);
    setShowLine1(false);
    setShowLine2(false);

    function go(fn: () => void, delay: number) {
      const t = setTimeout(fn, delay);
      timeouts.push(t);
    }

    let i = 0;

    function typeNext() {
      i++;
      setTyped(i);
      if (i < command.length) {
        go(typeNext, 38);
      } else {
        go(() => setShowLine1(true), 420);
        go(() => setShowLine2(true), 720);
        go(() => {
          i = 0;
          setTyped(0);
          setShowLine1(false);
          setShowLine2(false);
          go(typeNext, 350);
        }, 4800);
      }
    }

    go(typeNext, 550);
    return () => timeouts.forEach(clearTimeout);
  }, [command]);

  const displayCmd = command.slice(0, typed);
  const showCursor = typed === 0 || typed < command.length;

  return (
    <div className="terminal-window">
      <div className="terminal-bar">
        <span className="term-dot term-dot-r" />
        <span className="term-dot term-dot-y" />
        <span className="term-dot term-dot-g" />
        <span className="terminal-bar-title">bash</span>
      </div>
      <div className="terminal-body">
        <div className="term-line">
          <span className="term-prompt">❯ </span>
          <span className="term-cmd">{displayCmd}</span>
          {showCursor && <span className="term-cursor" />}
        </div>
        {showLine1 && (
          <div className="term-line term-output-line">
            <span className="term-tag-primary">[Claude Code]</span>
            <span className="term-arrow"> → </span>
            <span className="term-path">/Users/hacxy/.claude/skills</span>
          </div>
        )}
        {showLine2 && (
          <div className="term-line term-output-line">
            <span className="term-tag-success">[installed]</span>
            <span className="term-name"> {skillName}</span>
            <span className="term-arrow"> → </span>
            <span className="term-path">
              /Users/hacxy/.claude/skills/{skillName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
