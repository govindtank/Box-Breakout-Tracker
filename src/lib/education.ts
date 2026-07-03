/**
 * Comprehensive Darvas Box Theory Education Module
 */

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  sections: Section[];
  quiz?: QuizQuestion[];
  keyTakeaway: string;
}

export interface Section {
  heading: string;
  body: string;
  example?: string;
  tip?: string;
  warning?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const LESSONS: Lesson[] = [
  {
    id: 'what-is-darvas',
    title: 'What is the Darvas Box Theory?',
    subtitle: 'The origin story of one of trading\'s most elegant strategies',
    icon: '📦',
    level: 'beginner',
    keyTakeaway: 'The Darvas Box Theory is a momentum-based strategy that identifies stocks trading in a defined price range (the "box"), then enters on a breakout above the box top for maximum momentum capture.',
    sections: [
      {
        heading: 'The Origin Story',
        body: `The Darvas Box Theory was developed by Nicolas Darvas, a Hungarian-born dancer who turned $25,000 into $2,000,000 in just 18 months during the late 1950s. He was not a trained financier — he was a ballroom dancer touring the world who traded stocks using telegrams from his hotel rooms around the globe.

What makes Darvas remarkable is that he developed his system through pure empirical observation. While on tour, he would receive stock prices via telegram and noticed that certain stocks moved in predictable patterns — they would trade within a range (which he called a "box"), then explode upward when they broke out of that range.

His book "How I Made $2,000,000 in the Stock Market" (1960) remains a classic and is still studied by professional traders today. The book is remarkably humble and analytical — Darvas treats his failures as learning opportunities, documenting every trade, win and loss, with clinical precision.`,
        example: 'Darvas would mark boxes manually on graph paper. He drew horizontal lines at the high and low of each consolidation range. When a stock closed above the top line on high volume, he would buy. If it fell below the bottom line, he would sell. This simple system generated extraordinary returns.',
        tip: 'Darvas emphasized that his system worked because he was disciplined about FOLLOWING the system, not outsmarting it. His greatest wins came when he stuck to his rules during emotional market conditions.',
      },
      {
        heading: 'Core Philosophy: Momentum + Consolidation',
        body: `The Darvas Box Theory combines two powerful market concepts:

1. CONSOLIDATION PHASE: After a period of upward movement, a stock will "rest" by trading in a narrow range. This creates a box — defined by a clear TOP resistance level and a BOTTOM support level. During this phase, smart money accumulates shares quietly while impatient traders exit.

2. MOMENTUM PHASE: When the stock breaks ABOVE the top of the box on significantly higher volume, it signals that the accumulation phase is complete and the next leg up is beginning. This is the entry point.

The beauty of the Darvas system is that it forces you to buy at what appears to be the "high" of the range — but in reality, it's the LOWEST price of the next upward move. This is counter-intuitive for most traders who want to "buy low and sell high." Darvas taught that you should "buy high and sell higher."`,
        example: 'Consider a stock trading between ₹1,000 and ₹1,050 for 15 days. The box TOP is ₹1,050, bottom is ₹1,000. A Darvas trader WAITS until the stock closes above ₹1,050 (preferably on 2x average volume). They buy at ₹1,055-1,060. The stock then rallies to ₹1,200. The trader made ₹140/share, while someone who sold at ₹1,050 "because it was the top" missed the entire move.',
      },
      {
        heading: 'The Psychology Behind the Box',
        body: `The Darvas Box works because of specific human psychological behaviors in markets:

• RESISTANCE BECOMES SUPPORT: When a stock breaks above a resistance level (box top), that level psychologically becomes a new support floor. Previous sellers at that level now feel they "missed out" and become buyers on any dip back to that level.

• BREAKOUT ATTRACTS ATTENTION: A clean breakout above a well-defined range generates volume and attention from other traders, creating a self-fulfilling prophecy of upward momentum.

• THE PAIN OF MISSING: Darvas understood that the fear of missing a major move is stronger than the fear of losing money on a small stop-loss. By entering on breakouts with tight stops, risk is defined while reward is unlimited.

• ACCUMULATION PATTERNS: During box formation, institutional investors (mutual funds, FIIs, DIIs) accumulate positions without pushing the price too high. They want to build their position quietly. The breakout marks the point where their accumulation is complete.`,
        tip: 'The most reliable boxes are those preceded by strong uptrend momentum. A box forming after a 20-30% rally is more reliable than one forming after a downtrend. Context matters immensely.',
        warning: 'Beware of "fake breakouts" where price briefly pierces the box top but closes back inside. Darvas solved this by requiring a CLOSE above the top, not just an intraday spike. Always wait for the daily close confirmation.',
      },
      {
        heading: 'Key Components of a Darvas Box',
        body: `A valid Darvas Box has four essential elements:

1. TOP BOUNDARY: The highest price the stock reaches during the consolidation period. This acts as resistance. The top must be confirmed by at least 3 touches or attempts to breach.

2. BOTTOM BOUNDARY: The lowest price during consolidation. Acts as support. If the stock breaks below this, the box is invalidated.

3. GHOST DAYS (Lookback Period): Darvas used a 3-day rule — if the stock fails to make a new high for 3 consecutive days, the previous high becomes the box top. In Indian markets, this lookback should be adjusted for volatility. For highly liquid stocks (Nifty 50), 3-5 days works well. For mid-caps, 5-8 days may be more appropriate.

4. VOLUME CONFIRMATION: A breakout without volume is suspicious. Darvas looked for volume at least 50-100% above the 20-day average volume. This confirms institutional participation.

In the Indian market context, these parameters need adjustment based on the stock's liquidity and average daily range. A box for Reliance Industries will look different than one for a mid-cap stock.`,
        example: 'Box Parameters (Indian Markets):\n• Large-cap (Nifty 50): 3-5 ghost days, 1.5x volume threshold\n• Mid-cap: 5-7 ghost days, 2x volume threshold\n• Small-cap: 7-10 ghost days, 2.5x volume threshold\n• Breakout buffer: 0.15-0.30% above box top to filter noise',
      },
    ],
  },
  {
    id: 'box-patterns',
    title: 'Types of Darvas Box Patterns',
    subtitle: 'Recognizing different box formations for higher probability trades',
    icon: '📐',
    level: 'intermediate',
    keyTakeaway: 'Not all boxes are equal — ascending boxes, nested boxes, and flag formations each have different success rates and should be traded with appropriate position sizing.',
    sections: [
      {
        heading: 'Ascending Boxes (Bullish Continuation)',
        body: `The most powerful pattern — each successive box forms at a HIGHER level than the previous. This indicates strong sustained momentum.

CHARACTERISTICS:
• Each box bottom is higher than the previous box bottom
• Each box top breaks above the previous box top
• Volume contracts within the box and expands on breakout
• Box width typically decreases (squeeze pattern)

This is the pattern Darvas himself favored most. It represents a stock in a strong uptrend that keeps "resting and sprinting." In the Indian market, this pattern is most commonly seen in sector-leading stocks during bull runs.`,
        example: 'RELIANCE in 2021: Box 1: ₹1,900-₹2,000 → Breakout → Box 2: ₹2,050-₹2,150 → Breakout → Box 3: ₹2,200-₹2,350. Each box higher, each breakout explosive. A trader holding through all three boxes would have captured 40%+ gains.',
      },
      {
        heading: 'Nested Boxes (Flags)',
        body: `A tighter version where a small box forms WITHIN a larger box. This often precedes the most explosive breakouts as it represents extreme consolidation.

CHARACTERISTICS:
• A primary box contains one or more micro-boxes inside it
• Micro-boxes have very tight ranges (2-3% width compared to 5-8% for the primary)
• Volume dries up significantly during nested box formation
• Breakout from the nested box often triggers a cascade

This pattern is particularly effective for high-beta Indian stocks in the mid-cap space where institutional accumulation happens in tight ranges.`,
        tip: 'Nested boxes offer the best risk-reward ratio. Place your stop just below the micro-box bottom (tight), with a target at the next major resistance level (far).',
      },
      {
        heading: 'Expanding Boxes (Caution Required)',
        body: `A widening range pattern where each subsequent box has a LARGER range. This indicates decreasing momentum and potential reversals.

CHARACTERISTICS:
• Box width increases by more than 20% per cycle
• Volume patterns are erratic (spikes up then fades)
• Breakouts fail more frequently (failed breakouts > 50%)
• Often preceded major market tops

In the Indian market context, expanding boxes are common during budget weeks, F&O expiry, or major news events. They should generally be avoided or traded with significantly reduced position size.`,
        warning: 'Expanding boxes have a significantly higher failure rate. If you see a box where both the top and bottom are moving apart (not ascending parallel), REDUCE your position size by at least 50% or skip the trade entirely.',
      },
    ],
    quiz: [
      {
        question: 'Which Darvas pattern has the highest probability of success?',
        options: ['Expanding boxes', 'Ascending boxes (each higher than previous)', 'Descending boxes', 'Single isolated boxes'],
        correctIndex: 1,
        explanation: 'Ascending boxes represent sustained institutional accumulation and strong momentum. Each higher box confirms buyers are in control.',
      },
    ],
  },
  {
    id: 'entry-exit',
    title: 'Entry, Exit & Position Sizing',
    subtitle: 'Precise rules for when to buy, when to sell, and how much',
    icon: '🎯',
    level: 'advanced',
    keyTakeaway: 'The Darvas method is as much about RISK MANAGEMENT as it is about entry signals. A 2:1 reward-to-risk ratio minimum, trailing stops, and the "never average down" rule are non-negotiable.',
    sections: [
      {
        heading: 'The 5 Entry Rules',
        body: `Rule 1: CONFIRMED BOX — Wait for a box to fully form with at least ghost days of consolidation. Do not enter during box formation.

Rule 2: BREAKOUT CONFIRMATION — Enter only when the stock CLOSES above the box top. Intraday spikes that close back inside are not valid breakouts.

Rule 3: VOLUME CONFIRMATION — Breakout day volume should be at least 50% above the 20-day average volume. Higher is better.

Rule 4: MARKET CONTEXT — The broader market (Nifty/Sensex) should be in an uptrend or at least not in a sharp downtrend. Darvas always checked the market tide before buying any stock.

Rule 5: BUFFER — Enter 0.15-0.50% above the box top to avoid whipsaws. This small buffer filters out marginal breakouts that often fail.`,
        example: 'Setup: Stock ABC forms box ₹2,000-₹2,100 over 12 days. Ghost days setting: 4.\nDay 13: Stock closes at ₹2,106 (above box top ₹2,100). Volume: 85 lakh vs 30 lakh average (2.8x).\nEntry: Buy at ₹2,106 or set limit at ₹2,110 (buffer 0.2%).\nNifty is above 20 DMA in uptrend. All 5 rules satisfied → ENTER.',
        warning: 'NEVER enter before the close. Intraday breakouts can reverse violently in the last hour of trading. Wait for the closing bell confirmation. This rule alone will save you from 70% of false breakouts.',
      },
      {
        heading: 'Exit Strategies',
        body: `Darvas used THREE exit mechanisms:

1. STOP LOSS (The Box Bottom): Place the initial stop 2-3% below the box bottom. If the stock breaks below the box, the pattern is invalidated immediately. This is a HARD rule — no exceptions.

2. TRAILING STOP: As the stock moves up and forms new boxes, raise your stop to just below each new box bottom. This locks in profits while letting winners run.

3. THE 50% RETRACEMENT RULE: If a stock gives back 50% of its gain FROM THE LAST BOX BREAKOUT, exit immediately. This signals that the momentum has broken even if no new box has formed yet.

Darvas also used a simple principle: "Let your profits run, cut your losses short." He never averaged down on a losing position — if the stop was hit, he exited and moved on. No second chances, no hoping.`,
        example: 'Trailing Stop Example:\nBuy at ₹2,106 (box top target). Box bottom: ₹2,000. Initial stop: ₹1,960 (2% below bottom).\nStock rallies to ₹2,400. New box forms: ₹2,250-₹2,350. Raise stop to ₹2,200 (2% below new box bottom).\nStock rallies to ₹2,800. New box: ₹2,600-₹2,750. Raise stop to ₹2,548.\nIf stock reverses and hits ₹2,548 → Exit with ₹442 profit (21% gain).',
      },
      {
        heading: 'Position Sizing for Indian Markets',
        body: `Position sizing is CRITICAL for long-term success. Follow the 2% Rule:

MAX RISK PER TRADE = 2% of Total Capital

Formula: Position Size = (Total Capital × Risk %) / (Entry Price - Stop Loss Price)

EXAMPLES:
• Capital: ₹5,00,000
• Max risk per trade: ₹10,000 (2%)
• Entry: ₹2,106, Stop: ₹1,960 (risk per share: ₹146)
• Position size: ₹10,000 / ₹146 = 68 shares ≈ ₹1,43,208 (28.6% of capital)

ADJUSTMENTS FOR MARKET CONDITIONS:
• Strong bull market: 2-3% risk per trade
• Sideways market: 1-1.5% risk per trade
• Bear market: 0.5-1% risk per trade OR stay in cash
• Budget/event week: Reduce all positions by 50%

DIVERSIFICATION RULES:
• Maximum 5 simultaneous Darvas positions
• Maximum 15% allocation to one sector
• Add new positions only when stop-losses are at least 3% away from current price`,
        tip: 'Use a position sizing calculator before EVERY trade. If the numbers don\'t work (risk too high, position too small to be meaningful), skip the trade. Discipline over opportunity.',
      },
    ],
    quiz: [
      {
        question: 'What is the "never average down" rule in Darvas trading?',
        options: [
          'Never sell a losing position',
          'Never add more shares to a losing position',
          'Never buy at the bottom of the box',
          'Never trade during the first hour',
        ],
        correctIndex: 1,
        explanation: 'Darvas strictly avoided adding to losing positions. If a trade goes against you, exit and reassess. Adding to losers is the fastest way to blow up your account.',
      },
    ],
  },
  {
    id: 'risk-management',
    title: 'Risk Management & Psychology',
    subtitle: 'The mental framework that separates profitable traders from the rest',
    icon: '🛡️',
    level: 'expert',
    keyTakeaway: 'Risk management IS the strategy. A 50% win rate with 3:1 reward-to-risk ratio is far more profitable than a 70% win rate with 1:1 ratio.',
    sections: [
      {
        heading: 'The Mathematics of Survival',
        body: `Most traders fail not because their analysis is wrong, but because their position sizing destroys their capital before their edge can play out.

THE REALITY OF WIN RATES:
Even professional Darvas traders only win 40-60% of their trades. The key is that their WINNING trades are 2-3x larger than their LOSING trades.

DRAWDOWN MATH:
• A 10% loss requires 11% gain to break even
• A 20% loss requires 25% gain to break even
• A 30% loss requires 43% gain to break even
• A 50% loss requires 100% gain to break even

This is why the 2% rule exists. With 2% max risk per trade, you can have 20 consecutive losses and still retain 67% of your capital. With 10% risk per trade, 5 consecutive losses will destroy 41% of your capital.

In Indian markets, where volatility can spike 5-10% in a single session (budget day, RBI policy), this conservative approach is not optional — it\'s survival.`,
        warning: 'NEVER increase your position size after a loss to "make it back quickly." This is called "revenge trading" and it\'s the #1 cause of account blow-ups. Stick to your system. The market will still be there tomorrow.',
      },
      {
        heading: 'Trading Psychology: The Darvas Mindset',
        body: `Darvas identified three psychological traps that destroy traders:

1. THE HOPING TRAP: Holding a losing position because "it might come back." Darvas\'s rule: If your stop is hit, you EXIT. Immediately. No hesitation. The market doesn't care about your hope.

2. THE BOREDOM TRAP: Taking marginal trades just to "be in the market." Darvas spent months in cash waiting for the right setup. Inactivity is a virtue, not a weakness.

3. THE GREED TRAP: Not taking profits because "it might go higher." Use trailing stops to let winners run, but take partial profits (33-50%) at your first target.

DARVAS\'S DAILY RITUAL:
• Review all holdings before market open
• Check for new box formations
• Update stop-losses for all positions
• Review market context (Nifty trend, sector performance)
• Write down your plan for the day

In the modern context, this translates to: set alerts, update your spreadsheet, check your watchlist, and have a CLEAR written plan for every scenario before the market opens.`,
        tip: 'Keep a trading journal. Darvas documented EVERY trade. Record the entry reason, exit reason, box parameters, emotions felt, and lessons learned. Review monthly. Patterns in your psychology will emerge — fix them.',
      },
      {
        heading: 'Advanced: Correlation & Portfolio Heat',
        body: `One of the most overlooked aspects of Darvas box trading is PORTFOLIO CORRELATION.

If all your positions are in banking stocks (HDFC Bank, ICICI, Kotak, Axis, SBI), a single sector event can trigger all your stops simultaneously. This MULTIPLIES your risk.

THE HEAT RULE: Total portfolio heat (sum of all position risks) should not exceed 6% of total capital.
• 3 positions at 2% each = 6% maximum
• If you have 4 positions, each at 1.5% = 6% maximum
• Any more than 5 positions is not recommended

SECTOR CORRELATION MATRIX:
• Banking ↔ Finance (highly correlated 0.8+)
• IT ↔ Tech (highly correlated)
• Auto ↔ Metals (moderate correlation 0.5-0.7)
• FMCG ↔ Pharma (low correlation 0.3-0.4)
• Energy ↔ Anything (low correlation)

Aim to have positions in at least 3 uncorrelated sectors for proper diversification.`,
        example: 'Portfolio Heat Calculation:\nTotal Capital: ₹10,00,000\nPosition 1: HDFCBANK (Stop risk: ₹8,000 = 0.8%)\nPosition 2: RELIANCE (Stop risk: ₹12,000 = 1.2%)\nPosition 3: TCS (Stop risk: ₹10,000 = 1.0%)\nPosition 4: MARUTI (Stop risk: ₹15,000 = 1.5%)\nTotal Heat: ₹45,000 = 4.5% (under 6% limit) ✅',
      },
    ],
    quiz: [
      {
        question: 'What should you do after 3 consecutive losing trades?',
        options: [
          'Double your position size to recover losses',
          'Keep trading exactly as before — the system works over many trades',
          'Switch to a completely different strategy',
          'Take a break and review your journal for mistakes',
        ],
        correctIndex: 3,
        explanation: 'After consecutive losses, take a step back. Review your trades to check if you followed the rules. Often, losses come from rule violations, not strategy flaws.',
      },
    ],
  },
  {
    id: 'indian-market',
    title: 'Darvas for Indian Markets',
    subtitle: 'Adapting the strategy for NSE/BSE, F&O, and Indian market dynamics',
    icon: '🇮🇳',
    level: 'expert',
    keyTakeaway: 'Indian markets require adjustments for F&O expiry cycles, corporate action patterns, and higher retail participation that creates distinct box formations.',
    sections: [
      {
        heading: 'F&O Expiry & Darvas Boxes',
        body: `Indian derivatives markets have a UNIQUE characteristic — monthly expiry on the last Thursday. This creates predictable patterns:

WEEK BEFORE EXPIRY (Last Week):
• Box ranges may tighten as traders roll positions
• Breakouts during this week have lower reliability
• Consider reducing position size by 30-50%

EXPIRY DAY:
• High volatility in the last hour (15:00-15:30)
• Box breakouts during expiry day are LESS reliable
• Best approach: Wait until the next session for confirmation

NEW SERIES (First Week):
• Fresh institutional positioning creates opportunities
• Box formations in the first week of the new series are more reliable
• This is often the best time to initiate new Darvas positions

MONTHLY VS WEEKLY EXPIRY (BSE):
With the introduction of weekly expiries, Nifty now has Monday expiries, Bank Nifty on Tuesday, etc. This creates WEEKLY cycles of volatility that Darvas parameters need to account for.

ADJUSTMENT: Increase ghost days by 1-2 during expiry week to filter out expiry-related noise.`,
        warning: 'F&O expiry week breakouts are statistically 35% less reliable. If you must trade, require 3x volume confirmation instead of the standard 1.5x.',
      },
      {
        heading: 'Corporate Actions & Adjustments',
        body: `Indian stocks have several corporate action patterns that create false box breakouts:

BONUS ISSUES: Price adjusts proportionally. A box that appears to break down might just be adjusting for a 1:1 bonus. Always check corporate action calendars.

STOCK SPLITS: Similar to bonuses, splits change the price landscape. Box parameters need to be recalculated. Historical patterns are not comparable.

DIVIDEND ANNOUNCEMENTS: Stocks often run up before the record date and sell off after. Box breakouts just before dividend announcements are less reliable.

RIGHTS ISSUES / QIP: Significant price impacts. Box formations during these periods should be treated as unreliable.

BEST PRACTICE: Maintain a corporate actions calendar for all stocks in your watchlist. Filter out any box signals within 7 days before/after major corporate actions.

For NSE stocks, you can check corporate actions at: https://www.nseindia.com/companies-listing/corporate-filings-actions`,
      },
      {
        heading: 'Sector-Specific Box Behavior',
        body: `Different sectors in the Indian market display different box characteristics:

BANKING (HDFC Bank, ICICI, SBI):
• Wider boxes (6-8% range) due to higher volatility
• Ghost days: 5-7
• Most reliable breakout signals among all sectors
• Strong correlation with Bank Nifty trend

IT (TCS, Infosys, Wipro):
• Tighter boxes (3-5% range)
• Ghost days: 3-5
• Breakouts are often USD/INR driven
• Check dollar-rupee trend before entering

PHARMA (Sun Pharma, Divi\'s):
• Moderate range (4-6%)
• Ghost days: 5-8
• News-driven breakouts (FDA approvals) are unreliable
• Technical breakouts without news are more reliable

FMCG (HUL, ITC, Nestlé):
• Very tight boxes (2-3% range)
• Ghost days: 3-4
• Slow movers — require patience
• Best for defensive allocation during market uncertainty

AUTO (Maruti, Tata Motors, M&M):
• Wide ranges (7-12% due to cyclical nature)
• Ghost days: 7-10
• Seasonal patterns (festive season) matter significantly
• Check monthly sales data before entering`,
        tip: 'Create a sector-specific parameter profile and save it. This avoids the "one size fits all" mistake that causes most Darvas system failures in the Indian market.',
      },
    ],
  },
  {
    id: 'advanced-strategies',
    title: 'Advanced Strategies & Live Examples',
    subtitle: 'Real-world Indian market examples and advanced box trading techniques',
    icon: '⚡',
    level: 'expert',
    keyTakeaway: 'Combine Darvas boxes with volume profile, options flow, and market breadth for a complete institutional-grade trading system.',
    sections: [
      {
        heading: 'Volume Profile + Darvas Box Convergence',
        body: `The HIGHEST probability setups occur when Darvas boxes align with Volume Profile analysis:

HIGH VOLUME NODES (HVN): If the box bottom aligns with a high volume node (area where most trading occurred), it acts as SUPER SUPPORT. Breakouts from these boxes have a 75%+ success rate.

LOW VOLUME ZONES: Boxes forming in low volume zones (gaps in the volume profile) are less reliable. The lack of institutional participation means the box may be driven by retail noise.

POINT OF CONTROL (POC): If the box middle aligns with the POC (price where maximum volume traded), the box is considered "fair" and breakouts in either direction are equally likely.

VWAP RELATIONSHIP:
• Box ABOVE VWAP = Bullish bias (buy breakouts)
• Box BELOW VWAP = Bearish bias (sell breakdowns or avoid)
• Box straddling VWAP = Neutral (reduce position size)

In the Indian market, combining Darvas with VWAP is particularly effective for F&O stocks where institutional activity is visible in the volume profile.`,
        example: 'Setup: HDFCBANK forms box ₹1,450-₹1,520 over 9 days. Volume profile shows HVN at ₹1,460 (box bottom). POC at ₹1,490 (box middle). VWAP at ₹1,485. Stock is above VWAP, box is above VWAP. This is a HIGH CONVICTION bullish Darvas setup.',
      },
      {
        heading: 'Options Flow Confirmation',
        body: `For experienced traders, options flow provides additional confirmation for Darvas box breakouts:

CALL WRITING AT RESISTANCE: Before a box breakout, you may see large Call writing at the box top strike price. This creates resistance. A breakout above this level forces Call writers to cover, adding fuel to the move.

PUT BUILDING AT SUPPORT: Large Put buying or writing at the box bottom confirms the support level. A breakdown below this level accelerates as Put sellers hedge.

MAX PAIN ANALYSIS: The box often forms around the Max Pain level (where options buyers lose the most money). Breakouts from this level are particularly powerful as they trigger forced hedging.

CHANGE IN OI (Open Interest):
• +ve price + +ve OI = Strong trend (confirms breakout)
• +ve price + -ve OI = Short covering (weaker breakout)
• -ve price + +ve OI = Strong downtrend
• -ve price + -ve OI = Long unwinding (weak breakdown)

You can check NSE option chain data at: https://www.nseindia.com/option-chain`,
      },
      {
        heading: 'Live Case Study: RELIANCE Darvas Setup 2024',
        body: `A COMPLETE WALKTHROUGH of a fictional but realistic RELIANCE Darvas trade:

CONTEXT: June 2024. Reliance has been consolidating for 3 weeks after a 15% rally from May lows. Nifty is in a confirmed uptrend, above all key moving averages. FIIs have been net buyers in the energy sector.

BOX IDENTIFICATION:
• Period: June 3 - June 21 (15 trading days)
• Top: ₹2,980 (touched 4 times — June 5, 10, 14, 18)
• Bottom: ₹2,850 (touched 3 times — June 4, 12, 19)
• Average volume: 85 lakh shares
• Ghost days setting: 5

ENTRY (June 24):
• Stock opens at ₹2,975 and rallies to ₹2,995
• Closes at ₹3,010 (above box top ₹2,980)
• Volume: 2.1 Cr (2.5x average) ✅
• Nifty up 0.8% ✅
• Enter at ₹3,010

RISK MANAGEMENT:
• Stop Loss: ₹2,790 (2% below box bottom ₹2,850)
• Position Size (₹5L capital): ₹10,000 / (₹3,010 - ₹2,790) = 45 shares
• Investment: ₹1,35,450 (27% of capital)

EXIT:
• June 28: Stock hits ₹3,150. New box forming ₹3,050-₹3,120.
• Raise stop to ₹2,990 (2% below new box bottom)
• July 5: Stock hits ₹3,300. Trailing stop at ₹3,150.
• July 12: Stock breaks down, hits trailing stop at ₹3,150.
• Profit: ₹3,150 - ₹3,010 = ₹140/share × 45 = ₹6,300 (4.7% return in 18 days)

ANNUALIZED: 4.7% in 18 days = ~95% annualized return on capital deployed.`,
        tip: 'The key to this trade working was DISCIPLINE — waiting for the full 15-day box formation, requiring volume confirmation, and trailing the stop without emotion. Most traders would have entered early or exited too soon.',
      },
    ],
  },
];

export function getLessonsByLevel(level: Lesson['level']): Lesson[] {
  return LESSONS.filter(l => l.level === level);
}

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find(l => l.id === id);
}

export function getTotalLessons(): number {
  return LESSONS.length;
}

export function getTotalQuizQuestions(): number {
  return LESSONS.reduce((sum, l) => sum + (l.quiz?.length || 0), 0);
}
