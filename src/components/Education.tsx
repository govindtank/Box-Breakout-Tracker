import React from 'react';
import { BookOpen, CheckCircle, Lightbulb, AlertTriangle } from 'lucide-react';

export default function EducationView() {
  const lessons = [
    {
      title: "What is a Darvas Box?",
      icon: BookOpen,
      content: (
        <div className="space-y-3">
          <p>
            The <strong>Darvas Box</strong> is a trend-following strategy developed by Nasdaq chairman 
            Nicolas Darvas in the 1930s. He used this method to turn $10,000 into $200,000 in six months.
          </p>
          <p>
            The core idea: When a stock price breaks above its established range (box), it indicates 
            strong upward momentum and presents a buy opportunity. Similarly, breakdowns signal 
            downward momentum for exit/short signals.
          </p>
        </div>
      ),
    },
    {
      title: "How Box Formation Works",
      icon: Lightbulb,
      content: (
        <div className="space-y-3">
          <p>
            <strong>Step 1: Seek Top</strong> – Wait for price to reach a resistance level and confirm it stays 
            there for "ghost days" (typically 2-5 days without breaking through).
          </p>
          <p>
            <strong>Step 2: Seek Bottom</strong> – Once top is confirmed, wait for support to form in the same way.
          </p>
          <p>
            <strong>Step 3: Box Formed</strong> – When both levels are confirmed, draw a box between them. The stock 
            now trades within this range.
          </p>
          <p>
            <strong>Step 4: Watch for Breakout</strong> – If price closes above the box top, enter a LONG position. 
            Set profit target at next resistance or exit on breakdown below box bottom.
          </p>
        </div>
      ),
    },
    {
      title: "Entry & Exit Rules",
      icon: CheckCircle,
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
            <strong>🟢 LONG Entry:</strong> Close price breaks above box top + volume confirmation
          </div>
          <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
            <strong>🔴 LONG Exit:</strong> Close price breaks below box bottom (box breakdown)
          </div>
          <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
            <strong>🔵 New Box Forms:</strong> After breakout, wait for next box formation before re-entry
          </div>
        </div>
      ),
    },
    {
      title: "Key Concepts",
      icon: BookOpen,
      content: (
        <div className="space-y-3">
          <p><strong>Ghost Days:</strong> Number of days to confirm a level without breaking through (2-5 days)</p>
          <p><strong>Box Height:</strong> Distance between top and bottom levels (typically 8-15%)</p>
          <p><strong>Bulk Price:</strong> Midpoint of box where price spends most of its time</p>
          <p><strong>Climax Reversal:</strong> Extreme move that forms a new box when trend accelerates</p>
        </div>
      ),
    },
    {
      title: "Risk Management",
      icon: AlertTriangle,
      content: (
        <div className="space-y-3">
          <p>
            <strong>Position Sizing:</strong> Darvas recommended trading with full equity in paper trading. 
            For real money, use 1-2% risk per trade.
          </p>
          <p>
            <strong>Stop Loss:</strong> Box bottom level for long positions (technical stop)
          </p>
          <p>
            <strong>Trailing Stop:</strong> Lower box top as price advances to lock in profits
          </p>
          <p>
            <strong>Avg. Trade Duration:</strong> Days to weeks (trend-following, not day trading)
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0B0E14]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-[#131722] shrink-0">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Darvas Box Academy</h2>
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <div 
              key={index} 
              className="bg-[#131722] rounded-lg border border-slate-800 overflow-hidden hover:border-blue-500/30 transition-colors"
            >
              <div className="p-4 border-b border-slate-800">
                <lesson.icon className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white ml-2">{lesson.title}</h3>
              </div>
              <div className="p-4 text-slate-300 text-sm leading-relaxed">
                {lesson.content}
              </div>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="mt-6 p-4 bg-blue-600/10 rounded-lg border border-blue-500/20">
          <h3 className="text-sm font-bold text-blue-400 mb-2 flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" />
            <span>Pro Tips</span>
          </h3>
          <ul className="space-y-1 text-xs text-slate-400">
            <li>✓ Work with the trend — only enter long positions</li>
            <li>✓ Wait for box formation before entering — don't chase breakouts</li>
            <li>✓ Adjust ghost days based on market volatility</li>
            <li>✓ The best setups occur after consolidation periods</li>
          </ul>
        </div>

        {/* Strategy Stats */}
        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h3 className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">
            Strategy Statistics
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="text-slate-400">
              <span className="text-slate-600 block">Average Trade Duration</span>
              <span className="text-white font-mono">3.2 - 8.5 days</span>
            </div>
            <div className="text-slate-400">
              <span className="text-slate-600 block">Win Rate (Historical)</span>
              <span className="text-green-500 font-mono">58% - 72%</span>
            </div>
            <div className="text-slate-400">
              <span className="text-slate-600 block">Avg. Win/Loss Ratio</span>
              <span className="text-blue-500 font-mono">2.5 : 1</span>
            </div>
            <div className="text-slate-400">
              <span className="text-slate-600 block">Recommended Holding</span>
              <span className="text-white font-mono">Until breakdown</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
