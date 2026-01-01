import React, { useRef, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

const Terminal = ({ logs }) => {
    const terminalRef = useRef(null);
    const shouldAutoScroll = useRef(true);

    useEffect(() => {
        if (terminalRef.current && shouldAutoScroll.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    const handleScroll = () => {
        if (terminalRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            shouldAutoScroll.current = isAtBottom;
        }
    };

    return (
        <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col min-h-0">
            <div className="bg-slate-900/50 p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500 font-bold flex items-center gap-2">
                    <TerminalIcon size={12} />
                    SYSTEM TERMINAL
                </span>
            </div>

            <div
                ref={terminalRef}
                onScroll={handleScroll}
                className="flex-1 p-6 overflow-y-auto font-mono text-sm space-y-1 custom-scrollbar"
            >
                {logs.map((log, index) => (
                    <div key={index} className="text-green-400 hover:bg-slate-900/50 px-2 py-0.5 rounded flex items-start gap-2">
                        <span className="text-slate-600 select-none shrink-0">$</span>
                        <span className="break-all leading-relaxed">{log}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Terminal;
