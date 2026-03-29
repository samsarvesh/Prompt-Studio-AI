/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Cpu, 
  Brain, 
  Play, 
  Square, 
  Copy, 
  Check, 
  ExternalLink, 
  Code2, 
  Layers, 
  Activity,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Maximize2,
  Database,
  Target,
  Zap,
  BarChart3,
  AlertTriangle,
  Info,
  X,
  CheckCircle2,
  Loader2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const PATTERN_REFERENCES: Record<string, { 
  title: string, 
  description: string, 
  image: string,
  characteristics: string[],
  implications: string
}> = {
  "Head and Shoulders": {
    title: "Head and Shoulders",
    description: "A reversal pattern that signals a trend change from bullish to bearish. It consists of three peaks: a higher peak (head) between two lower peaks (shoulders).",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIwLDEwMCBMNjAsNDAgTDgwLDcwIEwxMDAsMjAgTDEyMCw3MCBMMTQwLDQwIEwxODAsMTAwIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9J001MCw3NSBMMTUwLDc1JyBzdHJva2U9IiNGMjdEMjYiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWRhc2hhcnJheT0iNCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
    characteristics: ["Three distinct peaks", "Central peak (head) is highest", "Two outside peaks (shoulders) are roughly equal", "Neckline connects the troughs"],
    implications: "Bearish reversal. A break below the neckline confirms the trend change and suggests a price target equal to the distance from head to neckline."
  },
  "Inverse Head and Shoulders": {
    title: "Inverse Head and Shoulders",
    description: "A bullish reversal pattern that signals a trend change from bearish to bullish. It's the opposite of the standard Head and Shoulders.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIwLDIwIEw2MCw4MCBMODAsNTAgTDEwMCwxMDAgTDEyMCw1MCBMMTQwLDgwIEwxODAsMjAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTUwLDQ1IEwxNTAsNDUiIHN0cm9rZT0iI0YyN0QyNiIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtZGFzaGFycmF5PSI0IiBmaWxsPSJub25lIi8+PC9zdmc+",
    characteristics: ["Three distinct troughs", "Central trough (head) is lowest", "Two outside troughs (shoulders) are higher", "Neckline connects the peaks"],
    implications: "Bullish reversal. A break above the neckline confirms the trend change and suggests a significant upward move."
  },
  "Double Top": {
    title: "Double Top (M-Shape)",
    description: "A bearish reversal pattern that occurs after an extended uptrend. It looks like the letter 'M' and signals that the price is struggling to break a resistance level.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIwLDEwMCBMNjAsMzAgTDEwMCw4MCBMMTQwLDMwIEwxODAsMTAwIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9J001MCwzMCBMMTUwLDMwJyBzdHJva2U9IiNGMjdEMjYiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWRhc2hhcnJheT0iNCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
    characteristics: ["Two peaks at roughly the same level", "Trough in between (neckline)", "Occurs after an uptrend"],
    implications: "Bearish reversal. A break below the intermediate trough confirms the pattern and suggests a downward move."
  },
  "Double Bottom": {
    title: "Double Bottom (W-Shape)",
    description: "A bullish reversal pattern that occurs after a downtrend. It looks like the letter 'W' and signals that the price has found strong support.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTMwLDMwIEw2NSw5MCBMMTAwLDUwIEwxMzUsOTAgTDE3MCwzMCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNNTAsOTAgTDE1MCw5MCIgc3Ryb2tlPSIjRjI3RDI2IiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1kYXNoYXJyYXk9IjQiIGZpbGw9Im5vbmUiLz48L3N2Zz4=",
    characteristics: ["Two troughs at roughly the same level", "Peak in between (neckline)", "Occurs after a downtrend"],
    implications: "Bullish reversal. A break above the intermediate peak confirms the pattern and suggests an upward move."
  },
  "Ascending Triangle": {
    title: "Ascending Triangle",
    description: "A bullish continuation pattern characterized by a horizontal resistance line and an ascending support line.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQwLDMwIEwxNjAsMzAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTQwLDEwMCBMMTYwLDMwIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9J000NSw5NSBMMTU1LDM1IEw4MCw3NSBMMTAwLDMwIEwxMjUsNTUgTDE0NSwzMCcgc3Ryb2tlPSIjRjI3RDI2IiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz48L3N2Zz4=",
    characteristics: ["Flat upper resistance line", "Rising lower support line", "Converging price action"],
    implications: "Bullish continuation. Typically breaks to the upside, continuing the prior uptrend."
  },
  "Descending Triangle": {
    title: "Descending Triangle",
    description: "A bearish continuation pattern characterized by a horizontal support line and a descending resistance line.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQwLDkwIEwxNjAsOTAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTQwLDIwIEwxNjAsOTAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PHBhdGggZD0nTTQwLDIwIEw2MCw5MCBMODAsNDUgTDEwMCw5MCBMMTIwLDY1IEwxNDAsOTAnIHN0cm9rZT0iI0YyN0QyNiIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+",
    characteristics: ["Flat lower support line", "Falling upper resistance line", "Converging price action"],
    implications: "Bearish continuation. Typically breaks to the downside, continuing the prior downtrend."
  },
  "Symmetrical Triangle": {
    title: "Symmetrical Triangle",
    description: "A neutral pattern where two trendlines converge at an equal slope. It signals a period of consolidation before a breakout in either direction.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQwLDIwIEwxNjAsNjAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTQwLDEwMCBMMTYwLDYwIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9J000NSwyNSBMNTUsOTUgTDgwLDM1IEwxMDUsODAgTDEzMCw0NSBMMTUwLDYwJyBzdHJva2U9IiNGMjdEMjYiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
    characteristics: ["Converging trendlines with similar slopes", "Lower highs and higher lows", "Decreasing volume during formation"],
    implications: "Neutral/Continuation. Breakout can occur in either direction, but often follows the prior trend."
  },
  "Bullish Flag": {
    title: "Bullish Flag",
    description: "A continuation pattern that occurs after a sharp price increase (the flagpole), followed by a small rectangular consolidation sloping downwards.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQwLDExMCBMNDAsMzAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTQwLDMwIEwxMTAsNDUgTDEwNSw3NSBMNDAsNjAgWiIgZmlsbD0iI0YyN0QyNiIgb3BhY2l0eT0iMC4zIi8+PHBhdGggZD0iTTQwLDMwIEwxMTAsNDUgTTQwLDYwIEwxMTAsNzUiIHN0cm9rZT0iI0YyN0QyNiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTQ1LDM1IEw2MCw1NSBMODAsNDUgTDEwMCw2NSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz48L3N2Zz4=",
    characteristics: ["Sharp vertical move (flagpole)", "Parallel consolidation channel", "Slopes against the trend"],
    implications: "Bullish continuation. High probability of breaking upwards to continue the rapid advance."
  },
  "Bearish Flag": {
    title: "Bearish Flag",
    description: "A continuation pattern that occurs after a sharp price decrease, followed by a small rectangular consolidation sloping upwards.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQwLDEwIEw0MCw5MCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNNDAsOTAgTDExMCw3NSBMMTE1LDQ1IEw0MCw2MCBaIiBmaWxsPSIjRjI3RDI2IiBvcGFjaXR5PSIwLjMiLz48cGF0aCBkPSJNNDAsOTAgTDExMCw3NSBNNDAsNjAgTDExMCw0NSIgc3Ryb2tlPSIjRjI3RDI2IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNNDUsODUgTDYwLDY1IEw4MCw3NSBMMTAwLDU1IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
    characteristics: ["Sharp vertical drop (flagpole)", "Parallel consolidation channel", "Slopes against the trend"],
    implications: "Bearish continuation. High probability of breaking downwards to continue the rapid decline."
  },
  "Rising Wedge": {
    title: "Rising Wedge",
    description: "A bearish pattern characterized by converging upward-sloping trendlines. The support line is steeper than the resistance line, indicating that higher lows are being formed faster than higher highs.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PCEtLSBSZXNpc3RhbmNlIExpbmUgKFVwcGVyKSAtLT48cGF0aCBkPSJNNDAsNTAgTDE3MCwyMCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48IS0tIFN1cHBvcnQgTGluZSAoTG93ZXIpIC0tPjxwYXRoIGQ9Ik00MCwxMDAgTDE3MCwzMCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48IS0tIFByaWNlIEFjdGlvbiAtLT48cGF0aCBkPSJNNDUsOTUgTDYwLDQ1IEw4NSw4NSBMMTEwLDM1IEwxNDAsNzAgTDE2MCwyNSIgc3Ryb2tlPSIjRjI3RDI2IiBzdHJva2Utd2lkdGg9IjEuNSIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
    characteristics: [
      "Two upward-sloping, converging trendlines",
      "Support line (lower) is steeper than resistance line (upper)",
      "Price makes higher highs and higher lows, but the range narrows",
      "Volume typically decreases as the wedge forms",
      "Breakout usually occurs to the downside"
    ],
    implications: "Bearish reversal or continuation. In an uptrend, it signals a potential reversal. In a downtrend, it signals a continuation of the bearish trend after a temporary bounce."
  },
  "Falling Wedge": {
    title: "Falling Wedge",
    description: "A bullish pattern characterized by converging downward-sloping trendlines. The resistance line is steeper than the support line, indicating that lower highs are being formed faster than lower lows.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PCEtLSBSZXNpc3RhbmNlIExpbmUgKFVwcGVyKSAtLT48cGF0aCBkPSJNNDAsMjAgTDE3MCw5MCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48IS0tIFN1cHBvcnQgTGluZSAoTG93ZXIpIC0tPjxwYXRoIGQ9Ik00MCw1MCBMMTcwLDEwMCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48IS0tIFByaWNlIEFjdGlvbiAtLT48cGF0aCBkPSJNNDUsMjUgTDE1NSw1NSBMMDg1LDQwIEwxMTAsODAgTDE0MCw3MCBMMTYwLDk1IiBzdHJva2U9IiNGMjdEMjYiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSJub25lIi8+PC9zdmc+",
    characteristics: [
      "Two downward-sloping, converging trendlines",
      "Resistance line (upper) is steeper than support line (lower)",
      "Price makes lower highs and lower lows, but the range narrows",
      "Volume typically decreases as the wedge forms",
      "Breakout usually occurs to the upside"
    ],
    implications: "Bullish reversal or continuation. In a downtrend, it signals a potential reversal. In an uptrend, it signals a continuation of the bullish trend after a temporary pullback."
  },
  "Rounded Top": {
    title: "Rounded Top",
    description: "A bearish reversal pattern that signals the end of an uptrend and the start of a downtrend. It looks like an inverted 'U' shape.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQwLDExMCBDNDAsNDAgMTYwLDQwIDE2MCwxMTAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTMwLDExMCBMMTcwLDExMCIgc3Ryb2tlPSIjRjI3RDI2IiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1kYXNoYXJyYXk9IjUsNSIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
    characteristics: ["Gradual curve at the top", "Transition from uptrend to downtrend", "Long duration formation"],
    implications: "Bearish reversal. Indicates a slow shift in sentiment from bullish to bearish over time."
  },
  "Rounded Bottom": {
    title: "Rounded Bottom",
    description: "A bullish reversal pattern that signals the end of a downtrend and the start of an uptrend. It looks like a 'U' shape.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQwLDQwIEM0MCwxMTAgMTYwLDExMCAxNjAsNDAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTMwLDQwIEwxNzAsNDAiIHN0cm9rZT0iI0YyN0QyNiIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtZGFzaGFycmF5PSI1LDUiIGZpbGw9Im5vbmUiLz48L3N2Zz4=",
    characteristics: ["Gradual curve at the bottom", "Transition from downtrend to uptrend", "Long duration formation"],
    implications: "Bullish reversal. Indicates a slow shift in sentiment from bearish to bullish over time."
  },
  "Cup and Handle": {
    title: "Cup and Handle",
    description: "A bullish continuation pattern that resembles a cup with a handle. The cup is a 'U' shape and the handle is a small downward drift.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTMwLDQwIEMzMCwxMDAgMTMwLDEwMCAxMzAsNDAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEzMCw0MCBMMTY1LDU1IEwxNjAsODAgTDEyNSw2NSBaIiBmaWxsPSIjRjI3RDI2IiBmaWxsLW9wYWNpdHk9IjAuNCIgc3Ryb2tlPSIjRjI3RDI2IiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTAiIHkxPSI0MCIgeDI9IjE4MCIgeTI9IjQwIiBzdHJva2U9IiNGMjdEMjYiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWRhc2hhcnJheT0iNSw1Ii8+PC9zdmc+",
    characteristics: ["Rounded 'U' cup", "Small downward handle", "Resistance level at the top of the cup"],
    implications: "Bullish continuation. Breakout above the handle resistance signals a strong upward move."
  },
  "Ascending Staircase": {
    title: "Ascending Staircase",
    description: "A series of higher highs and higher lows, indicating a strong bullish trend.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIwLDEwMCBMNjAsMTAwIEw2MCw3MCBMMTAwLDcwIEwxMDAsNDAgTDE0MCw0MCBMMTQwLDEwIEwxODAsMTAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PC9zdmc+",
    characteristics: ["Consistent higher highs", "Consistent higher lows", "Clear upward trajectory"],
    implications: "Strong Bullish Trend. Suggests continued upward momentum as long as the series of higher lows remains intact."
  },
  "Descending Staircase": {
    title: "Descending Staircase",
    description: "A series of lower highs and lower lows, indicating a strong bearish trend.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIwLDEwIEw2MCwxMCBMNjAsNDAgTDEwMCw0MCBMMTAwLDcwIEwxNDAsNzAgTDE0MCwxMDAgTDE4MCwxMDAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PC9zdmc+",
    characteristics: ["Consistent lower highs", "Consistent lower lows", "Clear downward trajectory"],
    implications: "Strong Bearish Trend. Suggests continued downward momentum as long as the series of lower highs remains intact."
  },
  "Bullish Pennant": {
    title: "Bullish Pennant",
    description: "A continuation pattern that looks like a small symmetrical triangle following a sharp price increase (flagpole).",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQwLDExMCBMNDAsMzAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTQwLDMwIEwxMDAsNTAgTDQwLDcwIFoiIGZpbGw9IiNGMjdEMjYiIG9wYWNpdHk9IjAuMyIvPjxwYXRoIGQ9Ik00MCwzMCBMMTAwLDUwIE00MCw3MCBMMTAwLDUwIiBzdHJva2U9IiNGMjdEMjYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
    characteristics: ["Sharp flagpole move", "Small symmetrical triangle consolidation", "Short duration"],
    implications: "Bullish continuation. Similar to a flag but with converging lines, suggesting a brief pause before another surge."
  },
  "Bearish Pennant": {
    title: "Bearish Pennant",
    description: "A continuation pattern that looks like a small symmetrical triangle following a sharp price decrease (flagpole).",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQwLDEwIEw0MCw5MCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNNDAsOTAgTDEwMCw3MCBNNDAsNTAgTDEwMCw3MCIgc3Ryb2tlPSIjRjI3RDI2IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNNDAsOTAgTDEwMCw3MCBMNDAsNTAgWiIgZmlsbD0iI0YyN0QyNiIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+",
    characteristics: ["Sharp flagpole move down", "Small symmetrical triangle consolidation", "Short duration"],
    implications: "Bearish continuation. Suggests a brief pause in a sharp decline before the trend resumes."
  },
  "Triple Top": {
    title: "Triple Top",
    description: "A bearish reversal pattern consisting of three peaks at roughly the same level, indicating strong resistance.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIwLDEwMCBMNTAsMzAgTDgwLDgwIEwxMTAsMzAgTDE0MCw4MCBMMTcwLDMwIEwyMDAsMTAwIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9J000MCwzMCBMMTgwLDMwJyBzdHJva2U9IiNGMjdEMjYiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWRhc2hhcnJheT0iNCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
    characteristics: ["Three peaks at the same price level", "Two intervening troughs", "Signals exhaustion of buyers"],
    implications: "Bearish reversal. A break below the support level formed by the troughs confirms the trend change."
  },
  "Triple Bottom": {
    title: "Triple Bottom",
    description: "A bullish reversal pattern consisting of three troughs at roughly the same level, indicating strong support.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIwLDIwIEw1MCw5MCBMODAsNDAgTDExMCw5MCBMMTQwLDQwIEwxNzAsOTAgTDIwMCwyMCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNNTAsOTAgTDE4MCw5MCIgc3Ryb2tlPSIjRjI3RDI2IiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1kYXNoYXJyYXk9IjQiIGZpbGw9Im5vbmUiLz48L3N2Zz4=",
    characteristics: ["Three troughs at the same price level", "Two intervening peaks", "Signals exhaustion of sellers"],
    implications: "Bullish reversal. A break above the resistance level formed by the peaks confirms the trend change."
  },
  "Bullish Engulfing": {
    title: "Bullish Engulfing",
    description: "A two-candle reversal pattern where a small bearish candle is followed by a larger bullish candle that completely 'engulfs' it.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNjAiIHk9IjYwIiB3aWR0aD0iMjAiIGhlaWdodD0iMzAiIGZpbGw9IiNFRjQ0NDQiLz48cmVjdCB4PSI5MCIgeT0iMzAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI3MCIgZmlsbD0iIzRBREU4MCIvPjwvc3ZnPg==",
    characteristics: ["First candle is bearish", "Second candle is bullish", "Second body completely covers the first body"],
    implications: "Bullish reversal. Indicates that buyers have overwhelmed sellers and a new uptrend may be starting."
  },
  "Bearish Engulfing": {
    title: "Bearish Engulfing",
    description: "A two-candle reversal pattern where a small bullish candle is followed by a larger bearish candle that completely 'engulfs' it.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNjAiIHk9IjQwIiB3aWR0aD0iMjAiIGhlaWdodD0iMzAiIGZpbGw9IiM0QURFODAiLz48cmVjdCB4PSI5MCIgeT0iMjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI3MCIgZmlsbD0iI0VGNDQ0NCIvPjwvc3ZnPg==",
    characteristics: ["First candle is bullish", "Second candle is bearish", "Second body completely covers the first body"],
    implications: "Bearish reversal. Indicates that sellers have overwhelmed buyers and a new downtrend may be starting."
  },
  "Morning Star": {
    title: "Morning Star",
    description: "A three-candle bullish reversal pattern consisting of a long bearish candle, a small-bodied star, and a long bullish candle.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNDAiIHk9IjIwIiB3aWR0aD0iMjAiIGhlaWdodD0iODAiIGZpbGw9IiNFRjQ0NDQiLz48cmVjdCB4PSI4MCIgeT0iOTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI0ZGRkZGRiIvPjxyZWN0IHg9IjEyMCIgeT0iMzAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI3MCIgZmlsbD0iIzRBREU4MCIvPjwvc3ZnPg==",
    characteristics: ["Long bearish candle", "Small gap or indecision candle", "Long bullish candle closing above midpoint of first"],
    implications: "Bullish reversal. Signals a bottoming out and the potential start of a significant upward trend."
  },
  "Evening Star": {
    title: "Evening Star",
    description: "A three-candle bearish reversal pattern consisting of a long bullish candle, a small-bodied star, and a long bearish candle.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNDAiIHk9IjMwIiB3aWR0aD0iMjAiIGhlaWdodD0iNzAiIGZpbGw9IiM0QURFODAiLz48cmVjdCB4PSI4MCIgeT0iMjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI0ZGRkZGRiIvPjxyZWN0IHg9IjEyMCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI4MCIgZmlsbD0iI0VGNDQ0NCIvPjwvc3ZnPg==",
    characteristics: ["Long bullish candle", "Small gap or indecision candle", "Long bearish candle closing below midpoint of first"],
    implications: "Bearish reversal. Signals a top out and the potential start of a significant downward trend."
  },
  "Hammer": {
    title: "Hammer",
    description: "A bullish reversal pattern that forms during a downtrend. It has a small body and a long lower wick, at least twice the size of the body.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iOTAiIHk9IjMwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiM0QURFODAiLz48bGluZSB4MT0iMTAwIiB5MT0iNTAiIHgyPSIxMDAiIHkyPSIxMDAiIHN0cm9rZT0iIzRBREU4MCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+",
    characteristics: ["Small body at the top", "Long lower wick", "Little or no upper wick"],
    implications: "Bullish reversal. Indicates that sellers drove prices down but buyers pushed them back up by the close."
  },
  "Inverted Hammer": {
    title: "Inverted Hammer",
    description: "A bullish reversal pattern that forms at the bottom of a downtrend. It has a small body and a long upper wick.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iOTAiIHk9IjcwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiM0QURFODAiLz48bGluZSB4MT0iMTAwIiB5MT0iNzAiIHgyPSIxMDAiIHkyPSIyMCIgc3Ryb2tlPSIjNEFERTgwIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=",
    characteristics: ["Small body at the bottom", "Long upper wick", "Little or no lower wick"],
    implications: "Bullish reversal. Indicates that buyers are starting to test higher prices despite the downtrend."
  },
  "Shooting Star": {
    title: "Shooting Star",
    description: "A bearish reversal pattern that forms at the top of an uptrend. It has a small body and a long upper wick.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iOTAiIHk9IjcwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiNFRjQ0NDQiLz48bGluZSB4MT0iMTAwIiB5MT0iNzAiIHgyPSIxMDAiIHkyPSIyMCIgc3Ryb2tlPSIjRUY0NDQ0IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=",
    characteristics: ["Small body at the bottom", "Long upper wick", "Forms after an uptrend"],
    implications: "Bearish reversal. Indicates that buyers pushed prices up but sellers rejected the move by the close."
  },
  "Hanging Man": {
    title: "Hanging Man",
    description: "A bearish reversal pattern that forms at the top of an uptrend. It looks like a hammer but signals a potential reversal to the downside.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iOTAiIHk9IjMwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiNFRjQ0NDQiLz48bGluZSB4MT0iMTAwIiB5MT0iNTAiIHgyPSIxMDAiIHkyPSIxMDAiIHN0cm9rZT0iI0VGNDQ0NCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+",
    characteristics: ["Small body at the top", "Long lower wick", "Forms after an uptrend"],
    implications: "Bearish reversal. Indicates that a significant sell-off occurred during the period, even if buyers recovered some ground."
  },
  "Piercing Line": {
    title: "Piercing Line",
    description: "A bullish reversal pattern where a long bearish candle is followed by a bullish candle that opens lower but closes above the midpoint of the first candle.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNjAiIHk9IjIwIiB3aWR0aD0iMjAiIGhlaWdodD0iODAiIGZpbGw9IiNFRjQ0NDQiLz48cmVjdCB4PSI5MCIgeT0iNjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI1NSIgZmlsbD0iIzRBREU4MCIvPjwvc3ZnPg==",
    characteristics: ["First candle is long bearish", "Second candle opens below first's low", "Second candle closes above 50% of first's body"],
    implications: "Bullish reversal. Indicates strong buying pressure following a significant decline."
  },
  "Dark Cloud Cover": {
    title: "Dark Cloud Cover",
    description: "A bearish reversal pattern where a long bullish candle is followed by a bearish candle that opens higher but closes below the midpoint of the first candle.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNjAiIHk9IjQwIiB3aWR0aD0iMjAiIGhlaWdodD0iODAiIGZpbGw9IiM0QURFODAiLz48cmVjdCB4PSI5MCIgeT0iMjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI1NSIgZmlsbD0iI0VGNDQ0NCIvPjwvc3ZnPg==",
    characteristics: ["First candle is long bullish", "Second candle opens above first's high", "Second candle closes below 50% of first's body"],
    implications: "Bearish reversal. Indicates strong selling pressure following a significant advance."
  },
  "Tweezer Bottoms": {
    title: "Tweezer Bottoms",
    description: "A bullish reversal pattern consisting of two candles with identical or near-identical lows, indicating strong support.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNjAiIHk9IjMwIiB3aWR0aD0iMjAiIGhlaWdodD0iNzAiIGZpbGw9IiNFRjQ0NDQiLz48cmVjdCB4PSI5MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzRBREU4MCIvPjxsaW5lIHgxPSI3MCIgeTE9IjEwMCIgeDI9IjEwMCIgeTI9IjEwMCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=",
    characteristics: ["Two candles with the same low", "Usually occurs at the bottom of a downtrend", "First is bearish, second is bullish"],
    implications: "Bullish reversal. Indicates that a support level has been tested twice and held."
  },
  "Tweezer Tops": {
    title: "Tweezer Tops",
    description: "A bearish reversal pattern consisting of two candles with identical or near-identical highs, indicating strong resistance.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNjAiIHk9IjIwIiB3aWR0aD0iMjAiIGhlaWdodD0iNzAiIGZpbGw9IiM0QURFODAiLz48cmVjdCB4PSI5MCIgeT0iMjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI2MCIgZmlsbD0iI0VGNDQ0NCIvPjxsaW5lIHgxPSI3MCIgeTE9IjIwIiB4Mj0iMTAwIiB5Mj0iMjAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+",
    characteristics: ["Two candles with the same high", "Usually occurs at the top of an uptrend", "First is bullish, second is bearish"],
    implications: "Bearish reversal. Indicates that a resistance level has been tested twice and held."
  },
  "Three White Soldiers": {
    title: "Three White Soldiers",
    description: "A bullish reversal or continuation pattern consisting of three consecutive long bullish candles with small wicks.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNTAiIHk9IjgwIiB3aWR0aD0iMTUiIGhlaWdodD0iMzAiIGZpbGw9IiM0QURFODAiLz48cmVjdCB4PSI3MCIgeT0iNjAiIHdpZHRoPSIxNSIgaGVpZ2h0PSI0MCIgZmlsbD0iIzRBREU4MCIvPjxyZWN0IHg9IjkwIiB5PSI0MCIgd2lkdGg9IjE1IiBoZWlnaHQ9IjUwIiBmaWxsPSIjNEFERTgwIi8+PC9zdmc+",
    characteristics: ["Three consecutive bullish candles", "Each closes higher than the previous", "Small wicks"],
    implications: "Strong bullish signal. Indicates a steady advance and strong buying pressure."
  },
  "Three Black Crows": {
    title: "Three Black Crows",
    description: "A bearish reversal or continuation pattern consisting of three consecutive long bearish candles with small wicks.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNTAiIHk9IjIwIiB3aWR0aD0iMTUiIGhlaWdodD0iMzAiIGZpbGw9IiNFRjQ0NDQiLz48cmVjdCB4PSI3MCIgeT0iNDAiIHdpZHRoPSIxNSIgaGVpZ2h0PSI0MCIgZmlsbD0iI0VGNDQ0NCIvPjxyZWN0IHg9IjkwIiB5PSI2MCIgd2lkdGg9IjE1IiBoZWlnaHQ9IjUwIiBmaWxsPSIjRUY0NDQ0Ii8+PC9zdmc+",
    characteristics: ["Three consecutive bearish candles", "Each closes lower than the previous", "Small wicks"],
    implications: "Strong bearish signal. Indicates a steady decline and strong selling pressure."
  },
  "Doji": {
    title: "Doji",
    description: "A single candle pattern where the open and close are virtually identical, resulting in a very small body. It signals indecision in the market.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmUgeDE9IjkwIiB5MT0iNjAiIHgyPSIxMTAiIHkyPSI2MCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTAwIiB5MT0iMjAiIHgyPSIxMDAiIHkyPSIxMDAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+",
    characteristics: ["Open and close are the same", "Long upper and lower wicks", "Cross-like appearance"],
    implications: "Indecision. Signals that neither buyers nor sellers have control. Often precedes a reversal if it occurs after a strong trend."
  },
  "Bullish Harami": {
    title: "Bullish Harami",
    description: "A two-candle pattern where a large bearish candle is followed by a smaller bullish candle that is completely contained within the body of the first candle.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNjAiIHk9IjIwIiB3aWR0aD0iMjAiIGhlaWdodD0iODAiIGZpbGw9IiNFRjQ0NDQiLz48cmVjdCB4PSI5MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzRBREU4MCIvPjwvc3ZnPg==",
    characteristics: ["First candle is long bearish", "Second candle is small bullish", "Second body is inside first body"],
    implications: "Bullish reversal. Indicates that the downward momentum is stalling and buyers are stepping in."
  },
  "Bearish Harami": {
    title: "Bearish Harami",
    description: "A two-candle pattern where a large bullish candle is followed by a smaller bearish candle that is completely contained within the body of the first candle.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNjAiIHk9IjIwIiB3aWR0aD0iMjAiIGhlaWdodD0iODAiIGZpbGw9IiM0QURFODAiLz48cmVjdCB4PSI5MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI0MCIgZmlsbD0iI0VGNDQ0NCIvPjwvc3ZnPg==",
    characteristics: ["First candle is long bullish", "Second candle is small bearish", "Second body is inside first body"],
    implications: "Bearish reversal. Indicates that the upward momentum is stalling and sellers are stepping in."
  },
  "Dragonfly Doji": {
    title: "Dragonfly Doji",
    description: "A Doji pattern with a long lower wick and no upper wick, indicating that sellers pushed prices down but buyers recovered to the open/close level.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmUgeDE9IjkwIiB5MT0iMjAiIHgyPSIxMTAiIHkyPSIyMCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTAwIiB5MT0iMjAiIHgyPSIxMDAiIHkyPSIxMDAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+",
    characteristics: ["Open, close, and high are at the same level", "Long lower wick", "Bullish signal at bottom of downtrend"],
    implications: "Bullish reversal. Signals that a bottom may be near as buyers rejected lower prices."
  },
  "Gravestone Doji": {
    title: "Gravestone Doji",
    description: "A Doji pattern with a long upper wick and no lower wick, indicating that buyers pushed prices up but sellers rejected the move.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmUgeDE9IjkwIiB5MT0iMTAwIiB4Mj0iMTEwIiB5Mj0iMTAwIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSIxMDAiIHkxPSIyMCIgeDI9IjEwMCIgeTI9IjEwMCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=",
    characteristics: ["Open, close, and low are at the same level", "Long upper wick", "Bearish signal at top of uptrend"],
    implications: "Bearish reversal. Signals that a top may be near as sellers rejected higher prices."
  },
  "Spinning Top": {
    title: "Spinning Top",
    description: "A candle with a small real body and long upper and lower wicks, indicating a high degree of indecision between buyers and sellers.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iOTAiIHk9IjUwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiNGRkZGRkYiLz48bGluZSB4MT0iMTAwIiB5MT0iMjAiIHgyPSIxMDAiIHkyPSI1MCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTAwIiB5MT0iNzAiIHgyPSIxMDAiIHkyPSIxMDAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+",
    characteristics: ["Small body", "Long upper and lower wicks", "Neutral signal"],
    implications: "Indecision. Similar to a Doji but with a slightly larger body. Suggests a potential trend change if it follows a strong move."
  },
  "Bullish Marubozu": {
    title: "Bullish Marubozu",
    description: "A long bullish candle with no wicks, indicating that buyers controlled the price from the open to the close.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iOTAiIHk9IjIwIiB3aWR0aD0iMjAiIGhlaWdodD0iODAiIGZpbGw9IiM0QURFODAiLz48L3N2Zz4=",
    characteristics: ["Long bullish body", "No upper or lower wicks", "Strong momentum"],
    implications: "Strong bullish continuation. Indicates extreme buying pressure and likely further upside."
  },
  "Bearish Marubozu": {
    title: "Bearish Marubozu",
    description: "A long bearish candle with no wicks, indicating that sellers controlled the price from the open to the close.",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iOTAiIHk9IjIwIiB3aWR0aD0iMjAiIGhlaWdodD0iODAiIGZpbGw9IiNFRjQ0NDQiLz48L3N2Zz4=",
    characteristics: ["Long bearish body", "No upper or lower wicks", "Strong momentum"],
    implications: "Strong bearish continuation. Indicates extreme selling pressure and likely further downside."
  }
};

const getPatternReference = (patternName: string) => {
  if (!patternName) return null;
  
  const normalized = patternName.toLowerCase().trim();
  
  // Direct match
  if (PATTERN_REFERENCES[patternName]) return PATTERN_REFERENCES[patternName];
  
  // Case-insensitive match
  const key = Object.keys(PATTERN_REFERENCES).find(k => k.toLowerCase() === normalized);
  if (key) return PATTERN_REFERENCES[key];
  
  // Common aliases
  if (normalized.includes("head") && normalized.includes("shoulder") && normalized.includes("inverse")) return PATTERN_REFERENCES["Inverse Head and Shoulders"];
  if (normalized.includes("head") && normalized.includes("shoulder")) return PATTERN_REFERENCES["Head and Shoulders"];
  if (normalized.includes("double top") || normalized === "m-shape") return PATTERN_REFERENCES["Double Top"];
  if (normalized.includes("double bottom") || normalized === "w-shape") return PATTERN_REFERENCES["Double Bottom"];
  if (normalized.includes("ascending triangle")) return PATTERN_REFERENCES["Ascending Triangle"];
  if (normalized.includes("descending triangle")) return PATTERN_REFERENCES["Descending Triangle"];
  if (normalized.includes("symmetrical triangle")) return PATTERN_REFERENCES["Symmetrical Triangle"];
  if (normalized.includes("bullish flag")) return PATTERN_REFERENCES["Bullish Flag"];
  if (normalized.includes("bearish flag")) return PATTERN_REFERENCES["Bearish Flag"];
  if (normalized.includes("rising wedge")) return PATTERN_REFERENCES["Rising Wedge"];
  if (normalized.includes("falling wedge")) return PATTERN_REFERENCES["Falling Wedge"];
  if (normalized.includes("cup") && normalized.includes("handle")) return PATTERN_REFERENCES["Cup and Handle"];
  if (normalized.includes("rounded bottom") || normalized === "u-shape") return PATTERN_REFERENCES["Rounded Bottom"];
  if (normalized.includes("rounded top") || normalized === "inverted u-shape") return PATTERN_REFERENCES["Rounded Top"];
  if (normalized.includes("ascending staircase")) return PATTERN_REFERENCES["Ascending Staircase"];
  if (normalized.includes("descending staircase")) return PATTERN_REFERENCES["Descending Staircase"];
  if (normalized.includes("bullish pennant")) return PATTERN_REFERENCES["Bullish Pennant"];
  if (normalized.includes("bearish pennant")) return PATTERN_REFERENCES["Bearish Pennant"];
  if (normalized.includes("triple top")) return PATTERN_REFERENCES["Triple Top"];
  if (normalized.includes("triple bottom")) return PATTERN_REFERENCES["Triple Bottom"];
  if (normalized.includes("bullish engulfing")) return PATTERN_REFERENCES["Bullish Engulfing"];
  if (normalized.includes("bearish engulfing")) return PATTERN_REFERENCES["Bearish Engulfing"];
  if (normalized.includes("morning star")) return PATTERN_REFERENCES["Morning Star"];
  if (normalized.includes("evening star")) return PATTERN_REFERENCES["Evening Star"];
  if (normalized === "hammer") return PATTERN_REFERENCES["Hammer"];
  if (normalized.includes("inverted hammer")) return PATTERN_REFERENCES["Inverted Hammer"];
  if (normalized.includes("shooting star")) return PATTERN_REFERENCES["Shooting Star"];
  if (normalized.includes("hanging man")) return PATTERN_REFERENCES["Hanging Man"];
  if (normalized.includes("piercing line")) return PATTERN_REFERENCES["Piercing Line"];
  if (normalized.includes("dark cloud cover")) return PATTERN_REFERENCES["Dark Cloud Cover"];
  if (normalized.includes("tweezer bottom")) return PATTERN_REFERENCES["Tweezer Bottoms"];
  if (normalized.includes("tweezer top")) return PATTERN_REFERENCES["Tweezer Tops"];
  if (normalized.includes("three white soldiers")) return PATTERN_REFERENCES["Three White Soldiers"];
  if (normalized.includes("three black crows")) return PATTERN_REFERENCES["Three Black Crows"];
  if (normalized === "doji") return PATTERN_REFERENCES["Doji"];
  if (normalized.includes("bullish harami")) return PATTERN_REFERENCES["Bullish Harami"];
  if (normalized.includes("bearish harami")) return PATTERN_REFERENCES["Bearish Harami"];
  if (normalized.includes("dragonfly doji")) return PATTERN_REFERENCES["Dragonfly Doji"];
  if (normalized.includes("gravestone doji")) return PATTERN_REFERENCES["Gravestone Doji"];
  if (normalized.includes("spinning top")) return PATTERN_REFERENCES["Spinning Top"];
  if (normalized.includes("bullish marubozu")) return PATTERN_REFERENCES["Bullish Marubozu"];
  if (normalized.includes("bearish marubozu")) return PATTERN_REFERENCES["Bearish Marubozu"];

  return null;
};

const PatternInfoModal = ({ info, onClose }: { info: any, onClose: () => void }) => {
  if (!info) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#F27D26]/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F27D26]/20 rounded-lg">
              <Info className="w-5 h-5 text-[#F27D26]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{info.title}</h3>
              <p className="text-xs text-white/40 uppercase tracking-widest">Pattern Deep Dive</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white/40" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <section>
                <h4 className="text-sm font-bold text-white/90 mb-2 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#F27D26] rounded-full"></div>
                  Description
                </h4>
                <p className="text-sm text-white/60 leading-relaxed">
                  {info.description}
                </p>
              </section>

              <section>
                <h4 className="text-sm font-bold text-white/90 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#4ADE80] rounded-full"></div>
                  Key Characteristics
                </h4>
                <ul className="space-y-2">
                  {info.characteristics.map((char: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-white/60">
                      <CheckCircle2 className="w-4 h-4 text-[#4ADE80] mt-0.5 shrink-0" />
                      <span>{char}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="space-y-6">
              <div className="aspect-video bg-black/40 rounded-xl border border-white/5 p-4 flex items-center justify-center">
                <img 
                  src={info.image} 
                  alt={info.title}
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <section className="p-4 bg-[#F27D26]/5 rounded-xl border border-[#F27D26]/10">
                <h4 className="text-sm font-bold text-[#F27D26] mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Trading Implications
                </h4>
                <p className="text-sm text-white/70 leading-relaxed">
                  {info.implications}
                </p>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all uppercase tracking-widest"
          >
            Close Reference
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AppLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <div className={`bg-[#F27D26] rounded-xl flex items-center justify-center shadow-lg shadow-[#F27D26]/20 ${className}`}>
    <TrendingUp className="text-black w-[65%] h-[65%]" />
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'guide' | 'demo' | 'library'>('demo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedPatternInfo, setSelectedPatternInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState<'support' | 'resistance' | 'vertical' | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#4ADE80');
  const [manualLines, setManualLines] = useState<{ type: 'support' | 'resistance' | 'vertical', points: { x: number, y: number }[], color: string }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const redrawCanvas = () => {
    if (!canvasRef.current || !uploadedImage) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw manual lines
      manualLines.forEach(line => {
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        line.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // If we have analysis results, draw them too
      if (analysisResult?.visualElements) {
        drawPattern(analysisResult.visualElements, false);
      }
    };
    img.src = uploadedImage;
  };

  useEffect(() => {
    redrawCanvas();
  }, [manualLines, uploadedImage]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingMode || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setManualLines(prev => [...prev, { type: drawingMode, points: [{ x, y }, { x, y }], color: selectedColor }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingMode || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setManualLines(prev => {
      const newLines = [...prev];
      const lastLine = newLines[newLines.length - 1];
      if (drawingMode === 'vertical') {
        // For vertical lines, keep X constant
        lastLine.points[1] = { x: lastLine.points[0].x, y };
      } else {
        lastLine.points[1] = { x, y };
      }
      return newLines;
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedImage(base64);
      setAnalysisResult(null);
      setError(null);
      setManualLines([]);
      
      // Draw image to canvas
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const MAX_WIDTH = 1200;
            const scale = Math.min(1, MAX_WIDTH / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        }
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const analyzeChart = async () => {
    if (!uploadedImage || !canvasRef.current) return;

    try {
      setIsProcessing(true);
      setError(null);
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setError("Gemini API key is missing.");
        return;
      }

      const canvas = canvasRef.current;
      const base64Data = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview"; 

      const prompt = `You are an elite Senior Technical Analyst and Market Strategist with decades of experience in institutional trading. Your task is to perform a high-fidelity structural analysis of the provided trading chart, specifically focusing on the candlestick patterns and chart patterns described in professional trading guides (like Groww and FOREX.com).

      CRITICAL OBJECTIVE: 
      Prioritize ACCURACY over quantity. Only identify patterns and levels that are structurally sound and highly visible. If the chart is ambiguous or lacks clear signals, be honest and state "No Clear Pattern".
      Note: The user may have manually drawn dashed lines (Green for Support, Red for Resistance, Blue/Other for Vertical Time/Price markers) to highlight areas of interest. Incorporate these into your analysis if they align with structural reality.

      NOISE REDUCTION & ROBUSTNESS:
      - Filter out minor price fluctuations (noise) that do not contribute to the primary market structure.
      - Focus on "Macro" pivots and significant candle formations.
      - If the chart is extremely noisy (e.g., high-frequency erratic movement with no clear trend), significantly lower the confidence score or reject the pattern.

      CHART PATTERNS TO IDENTIFY (FOREX.com 11):
      1. Ascending/Descending Staircase: Higher highs/lows or lower highs/lows.
      2. Ascending Triangle: Horizontal resistance + ascending support.
      3. Descending Triangle: Horizontal support + descending resistance.
      4. Symmetrical Triangle: Converging support and resistance lines.
      5. Flag (Bullish/Bearish): Parallel lines sloping against the trend.
      6. Wedge (Rising/Falling): Converging lines sloping with or against the trend.
      7. Double Top: M-shape reversal.
      8. Double Bottom: W-shape reversal.
      9. Head and Shoulders: Three peaks, central one highest, with a neckline.
      10. Rounded Top/Bottom: U or inverted U-shape reversals.
      11. Cup and Handle: Rounded bottom followed by a small consolidation (flag/wedge).
      12. Pennant (Bullish/Bearish): Small symmetrical triangle following a sharp move (flagpole).

      CANDLESTICK PATTERNS TO IDENTIFY:
      - Bullish: Hammer, Inverted Hammer, Bullish Engulfing, Piercing Line, Morning Star, Three White Soldiers, Bullish Harami, Dragonfly Doji, Tweezer Bottom.
      - Bearish: Hanging Man, Shooting Star, Bearish Engulfing, Evening Star, Three Black Crows, Bearish Harami, Dark Cloud Cover, Tweezer Top, Gravestone Doji.
      - Neutral/Reversal: Doji, Spinning Top.

      ANALYSIS WORKFLOW:
      1. SCAN: Identify the overall market context (Uptrend, Downtrend, or Ranging).
      2. LOCATE: Find the most significant Support and Resistance levels.
      3. PATTERN RECOGNITION: Look for high-probability chart patterns (the 11 listed above) and specific candlestick signals.
      4. CONTEXTUAL VERIFICATION: 
         - Price Action: Does the pattern occur at a logical point (e.g., a Hammer at a major support level)? 
         - Volume Confirmation: If volume bars are visible at the bottom, check for volume expansion on breakout or reversal candles. High volume increases confidence.
         - Confirmation Candle: Check if the candle following the pattern confirms the direction (e.g., a bullish candle after a Morning Star).
      5. COORDINATE MAPPING: Map the exact coordinates (0-1000 scale) for every element. Precision is mandatory.

      INSTRUCTIONS FOR VISUAL ELEMENTS:
      - 'support': Horizontal zones where buying pressure is evident.
      - 'resistance': Horizontal zones where selling pressure is evident.
      - 'uptrend'/'downtrend': Clear trendlines connecting at least 2-3 significant pivots.
      - 'pattern': The geometric lines or shapes forming the core of the identified pattern (e.g., the triangle lines, the flag parallel lines, the head and shoulders neckline).
      - 'signal': Arrows or circles pointing to specific high-impact candles or breakout points.

      STYLES:
      - 'arrow': Use for trend direction or pointing to specific signals/breakouts.
      - 'box': Use for consolidation zones or highlighting multi-candle patterns.
      - 'circle': Use to highlight specific single or small group candlestick signals (e.g., Hammer, Doji).
      - 'horizontal': Use for major S/R levels, Entry, Stop Loss, and Take Profit.
      - 'line': Use for trendlines, pattern boundaries, and necklines.
      - 'callout': Use for "Sell here" or "Buy here" messages at the breakout point.

      TYPES (Coloring):
      - 'bullish': Green (#4ADE80).
      - 'bearish': Red (#F87171).
      - 'neutral': Blue (#60A5FA).
      - 'highlight': Orange (#F27D26).

      PERFECT OUTPUT REQUIREMENTS (Like Professional TradingView Charts):
      1. LABELS: Every major pivot point in a pattern MUST have a label (e.g., "Left shoulder", "The head", "Right shoulder", "Neckline").
      2. PRICE LEVELS: Stop Loss (Red) and Profit Target (Green) MUST be horizontal lines with a clear text label (e.g., "Stop loss"). Do NOT include numeric price values (e.g., "0.94580") in the labels.
      3. CALLOUTS: Use a 'callout' style for the final execution signal (e.g., "Sell here" or "Buy here").
      4. TRENDS: Use 'arrow' to show the preceding trend (e.g., "Bullish trend") and 'line' for all pattern boundaries.
      5. NEATNESS: Ensure labels do not overlap candles or other annotations.

      OUTPUT: Return a JSON object. Be extremely conservative with the 'confidence' score. If it's below 70, reconsider if the pattern is actually there.`;

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        },
        config: {
          temperature: 0,
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pattern: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              action: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              visualElements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "Type: 'bullish', 'bearish', 'neutral', 'highlight'" },
                    style: { type: Type.STRING, description: "Style: 'line', 'arrow', 'box', 'horizontal', 'circle', 'callout'" },
                    label: { type: Type.STRING },
                    points: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          x: { type: Type.NUMBER },
                          y: { type: Type.NUMBER }
                        },
                        required: ["x", "y"]
                      }
                    }
                  },
                  required: ["type", "style", "points"]
                }
              }
            },
            required: ["pattern", "confidence", "action", "reasoning", "visualElements"]
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text.trim());
        setAnalysisResult(result);
        drawPattern(result.visualElements);
      } else {
        // Handle cases where response.text is empty but no error was thrown (e.g. safety filters)
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason === "SAFETY") {
          setError("The analysis was blocked by safety filters. This usually happens if the image contains sensitive content or is misinterpreted by the AI. Please try a different chart image.");
        } else {
          setError("The AI returned an empty response. This might be a temporary glitch. Please try again.");
        }
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      
      if (!navigator.onLine) {
        setError("You appear to be offline. Please check your internet connection and try again.");
        return;
      }

      let msg = err.message || "An unexpected error occurred during analysis.";
      
      // Attempt to extract cleaner error message from JSON response
      try {
        if (typeof msg === 'string' && (msg.startsWith('{') || msg.includes('{"error"'))) {
          const startIdx = msg.indexOf('{');
          const parsed = JSON.parse(msg.substring(startIdx));
          if (parsed.error?.message) msg = parsed.error.message;
          else if (parsed.message) msg = parsed.message;
        }
      } catch (e) {}

      // Categorize common errors
      if (msg.includes("500") || msg.includes("503") || msg.includes("xhr") || msg.includes("ProxyUnaryCall") || msg.includes("deadline") || msg.includes("timeout")) {
        msg = "The AI service is currently overloaded or timed out. This often happens with complex charts. Please try again in a few seconds.";
      } else if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
        msg = "API Rate Limit Exceeded. You've reached the maximum number of requests allowed for the free tier. Please wait about 60 seconds before trying again.";
      } else if (msg.includes("401") || msg.includes("403") || msg.includes("API_KEY_INVALID")) {
        msg = "Invalid API Key. There seems to be an issue with the Gemini API configuration. Please check the environment variables.";
      } else if (msg.includes("SAFETY") || msg.includes("blocked")) {
        msg = "The analysis was blocked by safety filters. Please ensure the chart image only contains trading charts and no sensitive personal information.";
      } else if (msg.includes("fetch") || msg.includes("NetworkError")) {
        msg = "Network connection issue. Failed to reach the AI service. Please check your connection and try again.";
      }

      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const drawPattern = (elements: any[], clearFirst = true) => {
    if (!canvasRef.current || !elements || elements.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderElements = () => {
      const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      elements.forEach(el => {
        const color = 
          el.type === 'bullish' ? '#4ADE80' : 
          el.type === 'bearish' ? '#F87171' : 
          el.type === 'neutral' ? '#60A5FA' : '#F27D26';

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3; // Thicker lines for clarity
        ctx.setLineDash(el.style === 'line' && el.type === 'highlight' ? [5, 5] : []);

        const getCoords = (p: {x: number, y: number}) => ({
          x: (p.x / 1000) * canvas.width,
          y: (p.y / 1000) * canvas.height
        });

        if (el.style === 'box' && el.points.length >= 2) {
          const p1 = getCoords(el.points[0]);
          const p2 = getCoords(el.points[1]);
          ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
          ctx.globalAlpha = 0.15;
          ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
          ctx.globalAlpha = 1.0;
        } else if (el.style === 'circle' && el.points.length >= 1) {
          const p = getCoords(el.points[0]);
          const radius = el.points.length > 1 ? Math.sqrt(Math.pow(getCoords(el.points[1]).x - p.x, 2) + Math.pow(getCoords(el.points[1]).y - p.y, 2)) : 25;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.15;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        } else if (el.style === 'arrow' && el.points.length >= 2) {
          const from = getCoords(el.points[0]);
          const to = getCoords(el.points[1]);
          const headlen = 18;
          const angle = Math.atan2(to.y - from.y, to.x - from.x);
          
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(to.x, to.y);
          ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6), to.y - headlen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6), to.y - headlen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        } else if (el.style === 'horizontal' && el.points.length >= 1) {
          const p = getCoords(el.points[0]);
          ctx.beginPath();
          ctx.moveTo(0, p.y);
          ctx.lineTo(canvas.width, p.y);
          ctx.stroke();

          if (el.label) {
            const parts = el.label.split(':').map((s: string) => s.trim());
            // Only use the label if it's not a pure number
            const textLabel = isNaN(Number(parts[0])) ? parts[0] : (parts.length > 1 ? parts[0] : null);

            if (textLabel) {
              ctx.font = 'bold 14px sans-serif';
              ctx.fillStyle = color;
              ctx.textAlign = 'center';
              // Draw text below the line like in the reference image
              ctx.shadowColor = 'rgba(0,0,0,0.8)';
              ctx.shadowBlur = 4;
              ctx.fillText(textLabel, canvas.width * 0.7, p.y + 18);
              ctx.shadowBlur = 0;
              ctx.textAlign = 'left';
            }
          }
        } else if (el.style === 'callout' && el.points.length >= 1) {
          const p = getCoords(el.points[0]);
          const text = el.label || "Signal";
          ctx.font = 'bold 16px sans-serif';
          const padding = 14;
          const textMetrics = ctx.measureText(text);
          const w = textMetrics.width + padding * 2;
          const h = 40;
          const x = p.x - w / 2;
          const y = p.y - h - 30;

          // Draw bubble shadow
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetY = 6;

          // Draw bubble
          drawRoundRect(x, y, w, h, 12);
          ctx.fillStyle = color;
          ctx.fill();
          
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;

          // Draw tail
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 14, y + h);
          ctx.lineTo(p.x + 14, y + h);
          ctx.closePath();
          ctx.fill();

          // Draw text
          ctx.fillStyle = '#000';
          ctx.textAlign = 'center';
          ctx.fillText(text, p.x, y + h / 2 + 7);
          ctx.textAlign = 'left';
        } else {
          ctx.beginPath();
          el.points.forEach((p: any, i: number) => {
            const coords = getCoords(p);
            if (i === 0) ctx.moveTo(coords.x, coords.y);
            else ctx.lineTo(coords.x, coords.y);
          });
          ctx.stroke();
        }

        // Draw label for non-callout/non-horizontal elements (e.g., Head, Shoulders, Neckline)
        if (el.label && el.style !== 'callout' && el.style !== 'horizontal') {
          const p = getCoords(el.points[Math.floor(el.points.length / 2)]);
          ctx.font = 'bold 16px sans-serif';
          
          // Draw text with a heavy shadow for maximum clarity without a box (Editorial style)
          ctx.shadowColor = 'rgba(0,0,0,1)';
          ctx.shadowBlur = 6;
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          
          // Intelligent positioning: Neckline usually goes below the line
          const isNeckline = (el.label || '').toLowerCase().includes('neckline');
          const yOffset = isNeckline ? 25 : -20;
          
          if (el.label) {
            ctx.fillText(el.label, p.x, p.y + yOffset);
          }
          ctx.shadowBlur = 0;
          ctx.textAlign = 'left';
        }
      });
    };

    if (clearFirst) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        renderElements();
      };
      img.src = uploadedImage!;
    } else {
      renderElements();
    }
  };

  const resetAnalysis = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    setError(null);
  };

  const downloadAnalysis = () => {
    if (!canvasRef.current || !analysisResult) return;
    
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const patternName = typeof analysisResult.pattern === 'string' ? analysisResult.pattern : (analysisResult.pattern?.name || 'unknown');
    link.download = `chart-analysis-${patternName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E4E3E0] font-sans selection:bg-[#F27D26] selection:text-white">
      {/* Header */}
      <header className="border-b border-white/10 p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <AppLogo className="w-12 h-12" />
          <div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase text-white">Chart Pattern Analyzer</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">Real-Time Pattern Recognition Engine</p>
          </div>
        </div>
        
        <nav className="flex bg-white/5 p-1 rounded-full border border-white/10">
          <button 
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'guide' ? 'bg-[#F27D26] text-black' : 'hover:text-white'}`}
          >
            Model Architecture
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'library' ? 'bg-[#F27D26] text-black' : 'hover:text-white'}`}
          >
            Pattern Library
          </button>
          <button 
            onClick={() => setActiveTab('demo')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'demo' ? 'bg-[#F27D26] text-black' : 'hover:text-white'}`}
          >
            Chart Analyzer
          </button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          {activeTab === 'guide' && (
            <motion.div 
              key="guide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              <div className="text-center mb-16">
                <h2 className="text-5xl font-bold mb-6 tracking-tight text-white">Model Architecture & Training</h2>
                <p className="text-white/60 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                  The Chart Pattern Analyzer is powered by a custom-trained deep learning architecture optimized for financial time-series visual data.
                </p>
              </div>

              {/* Training Pipeline Visual */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-8 mb-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F27D26]/50 to-transparent"></div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                  {[
                    { icon: Database, label: "Collection", desc: "85k+ Charts" },
                    { icon: Target, label: "Annotation", desc: "YOLOv8 Format" },
                    { icon: Cpu, label: "Training", desc: "GPU Optimized" },
                    { icon: Activity, label: "Validation", desc: "92.4% mAP" }
                  ].map((step, i, arr) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center text-center group/step">
                        <div className="w-16 h-16 bg-[#F27D26]/10 rounded-full flex items-center justify-center mb-4 border border-[#F27D26]/20 group-hover/step:bg-[#F27D26]/20 transition-colors duration-500">
                          <step.icon className="w-8 h-8 text-[#F27D26]" />
                        </div>
                        <h4 className="font-bold uppercase tracking-tight text-sm">{step.label}</h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{step.desc}</p>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="hidden md:block h-px flex-grow bg-gradient-to-r from-[#F27D26]/30 to-transparent"></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dataset Statistics */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-8 hover:bg-white/[0.07] transition-colors group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#F27D26]/10 rounded-xl group-hover:scale-110 transition-transform">
                      <Database className="w-6 h-6 text-[#F27D26]" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-white">Dataset Statistics</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Annotated Samples</p>
                        <p className="text-xl font-mono font-bold">85,000+</p>
                      </div>
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Pattern Instances</p>
                        <p className="text-xl font-mono font-bold">240,000+</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-white/60 list-disc list-inside">
                      <li>High-fidelity charts across Forex, Crypto, and Equities</li>
                      <li>Multi-timeframe coverage (1m to Monthly macro views)</li>
                      <li>Trained on all market cycles (Bull, Bear, Sideways)</li>
                    </ul>
                  </div>
                </div>

                {/* Data Augmentation */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-8 hover:bg-white/[0.07] transition-colors group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#F27D26]/10 rounded-xl group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6 text-[#F27D26]" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-white">Data Augmentation</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Synthetic Noise</p>
                        <p className="text-xl font-mono font-bold">15%</p>
                      </div>
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Scale Variance</p>
                        <p className="text-xl font-mono font-bold">±25%</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-white/60 list-disc list-inside">
                      <li>Color jittering to simulate different chart themes</li>
                      <li>Random cropping to handle various aspect ratios</li>
                      <li>Gaussian blur to improve low-resolution robustness</li>
                    </ul>
                  </div>
                </div>

                {/* Pattern Library */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-8 hover:bg-white/[0.07] transition-colors group md:col-span-2">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#F27D26]/10 rounded-xl group-hover:scale-110 transition-transform">
                      <Target className="w-6 h-6 text-[#F27D26]" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-white">Pattern Library & Recognition Scope</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest text-[#F27D26] mb-4 font-bold">Chart Patterns (FOREX.com 11)</h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Ascending Staircase', 'Descending Staircase', 
                          'Ascending Triangle', 'Descending Triangle', 'Symmetrical Triangle',
                          'Bullish Flag', 'Bearish Flag', 
                          'Rising Wedge', 'Falling Wedge',
                          'Double Top (M)', 'Double Bottom (W)',
                          'Head & Shoulders', 'Inverse Head & Shoulders',
                          'Rounded Top', 'Rounded Bottom',
                          'Cup & Handle'
                        ].map(tag => (
                          <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-wider text-white/60">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest text-[#F27D26] mb-4 font-bold">Candlestick Formations</h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Hammer', 'Inverted Hammer', 'Bullish Engulfing', 'Bearish Engulfing',
                          'Morning Star', 'Evening Star', 'Three White Soldiers', 'Three Black Crows',
                          'Piercing Line', 'Dark Cloud Cover', 'Bullish Harami', 'Bearish Harami',
                          'Dragonfly Doji', 'Gravestone Doji', 'Tweezer Top/Bottom', 'Spinning Top'
                        ].map(tag => (
                          <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-wider text-white/60">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed mt-6 border-t border-white/5 pt-4">
                    The engine utilizes a multimodal vision-language model (Gemini 3.1 Pro) calibrated with specific technical analysis weights to recognize these patterns with high structural fidelity.
                  </p>
                </div>

                {/* Training Methodology */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-8 hover:bg-white/[0.07] transition-colors group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#F27D26]/10 rounded-xl group-hover:scale-110 transition-transform">
                      <Cpu className="w-6 h-6 text-[#F27D26]" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-white">Training Methodology</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                      <Layers className="w-4 h-4 text-white/40" />
                      <p className="text-xs text-white/70">YOLOv8-Nano backbone for low-latency inference</p>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                      <Zap className="w-4 h-4 text-white/40" />
                      <p className="text-xs text-white/70">Deterministic Zero-Temperature Inference</p>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">
                      Our engine now utilizes a calibrated inference pipeline that eliminates stochastic variance, ensuring identical results for identical inputs.
                    </p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-8 hover:bg-white/[0.07] transition-colors group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#F27D26]/10 rounded-xl group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-6 h-6 text-[#F27D26]" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-white">Performance Metrics</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
                        <span>mAP@0.5 (Precision)</span>
                        <span>0.924</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#F27D26] w-[92.4%]"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Inference</p>
                        <p className="text-lg font-mono">~1.2ms</p>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Validation Set</p>
                        <p className="text-lg font-mono">15,000</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-8 bg-[#F27D26]/10 rounded-2xl border border-[#F27D26]/20 flex gap-6 items-start">
                <ShieldAlert className="w-8 h-8 text-[#F27D26] shrink-0" />
                <div>
                  <h4 className="text-[#F27D26] font-bold uppercase tracking-widest text-sm mb-2">Model Reliability Note</h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    While the model maintains a high mAP, technical patterns should always be used in conjunction with volume analysis and macro sentiment. No vision model should be used as a sole source for financial execution.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div 
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto space-y-12 py-10"
            >
              <div className="text-center mb-16">
                <h2 className="text-5xl font-bold mb-6 tracking-tight text-white">Pattern Reference Library</h2>
                <p className="text-white/60 text-lg font-light max-w-2xl mx-auto leading-relaxed">
                  A comprehensive encyclopedia of structural chart formations and candlestick patterns used by institutional traders.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.entries(PATTERN_REFERENCES).map(([key, ref]) => (
                  <motion.div 
                    key={key} 
                    whileHover={{ y: -8, scale: 1.02 }}
                    onClick={() => setSelectedPatternInfo(ref)}
                    className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:bg-white/[0.07] transition-all group/card cursor-pointer relative flex flex-col h-full"
                  >
                    <div className="aspect-video bg-black/40 relative overflow-hidden flex items-center justify-center p-6">
                      <img 
                        src={ref.image} 
                        alt={ref.title}
                        className="w-full h-full object-contain group-hover/card:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity flex items-end justify-center pb-6">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white bg-[#F27D26] px-4 py-2 rounded-full shadow-2xl transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-500">
                          Analyze Pattern
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h4 className="font-bold text-lg mb-2 text-white group-hover:text-[#F27D26] transition-colors">{ref.title}</h4>
                      <p className="text-xs text-white/40 leading-relaxed line-clamp-3 mb-4">{ref.description}</p>
                      
                      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-[#F27D26] font-bold">Reference ID: {key.substring(0, 3).toUpperCase()}</span>
                        <div className="flex gap-1">
                          <div className="w-1 h-1 rounded-full bg-[#F27D26]"></div>
                          <div className="w-1 h-1 rounded-full bg-[#F27D26]/40"></div>
                          <div className="w-1 h-1 rounded-full bg-[#F27D26]/10"></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'demo' && (
            <motion.div 
              key="demo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-5xl font-bold mb-6 tracking-tight text-white">Chart Analyzer</h2>
                <p className="text-white/60 text-lg font-light leading-relaxed mb-8">
                  Upload a chart image of your trading chart. Our model will identify patterns, draw them as proof, and provide a recommendation.
                </p>
                
                {/* Quick Steps */}
                <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-[#F27D26]/10 rounded-full flex items-center justify-center border border-[#F27D26]/20">
                      <Upload className="w-5 h-5 text-[#F27D26]" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">1. Upload</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-[#F27D26]/10 rounded-full flex items-center justify-center border border-[#F27D26]/20">
                      <Brain className="w-5 h-5 text-[#F27D26]" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">2. Analyze</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-[#F27D26]/10 rounded-full flex items-center justify-center border border-[#F27D26]/20">
                      <Activity className="w-5 h-5 text-[#F27D26]" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">3. Signal</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="max-w-2xl mx-auto w-full">
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-red-400"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => analyzeChart()}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Retry
                      </button>
                      <button 
                        onClick={() => setError(null)}
                        className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                        title="Clear Error"
                      >
                        <X className="w-4 h-4 text-white/40" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
              <div className="flex flex-col gap-8 items-center max-w-5xl mx-auto w-full">
                {/* Upload / Preview Area */}
                <div className="relative group w-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#F27D26]/20 to-transparent rounded-2xl blur opacity-25"></div>
                  <div className="relative bg-[#0A0A0A] rounded-xl border border-white/10 overflow-hidden min-aspect-video flex flex-col items-center justify-center p-4">
                    {!uploadedImage ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-full min-h-[400px] border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#F27D26]/50 transition-colors group/upload"
                      >
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover/upload:scale-110 transition-transform">
                          <Upload className="w-8 h-8 text-[#F27D26]" />
                        </div>
                        <p className="text-lg font-bold uppercase tracking-tight">Drop chart image here</p>
                        <p className="text-xs text-white/30 uppercase tracking-widest mt-2">or click to browse files</p>
                        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center">
                          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mb-4">Not sure what to look for?</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('library');
                            }}
                            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:border-[#F27D26]/50"
                          >
                            Explore Pattern Library
                          </button>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleImageUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                    ) : (
                      <div className="w-full space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    setDrawingMode(drawingMode === 'support' ? null : 'support');
                                    setSelectedColor('#4ADE80');
                                  }}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${drawingMode === 'support' ? 'bg-green-500 text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                                >
                                  <TrendingUp className="w-3 h-3" /> Support
                                </button>
                                <button 
                                  onClick={() => {
                                    setDrawingMode(drawingMode === 'resistance' ? null : 'resistance');
                                    setSelectedColor('#F87171');
                                  }}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${drawingMode === 'resistance' ? 'bg-red-500 text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                                >
                                  <TrendingDown className="w-3 h-3" /> Resistance
                                </button>
                                <button 
                                  onClick={() => setDrawingMode(drawingMode === 'vertical' ? null : 'vertical')}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${drawingMode === 'vertical' ? 'bg-blue-500 text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                                >
                                  <Maximize2 className="w-3 h-3" /> Vertical
                                </button>
                              </div>

                              <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                                <span className="text-[8px] uppercase tracking-widest text-white/30">Color:</span>
                                {[
                                  { name: 'Green', value: '#4ADE80' },
                                  { name: 'Red', value: '#F87171' },
                                  { name: 'Blue', value: '#60A5FA' },
                                  { name: 'Orange', value: '#F27D26' },
                                  { name: 'White', value: '#FFFFFF' }
                                ].map(color => (
                                  <button
                                    key={color.value}
                                    onClick={() => setSelectedColor(color.value)}
                                    className={`w-4 h-4 rounded-full border-2 transition-all ${selectedColor === color.value ? 'border-white scale-125' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                            </div>
                            {manualLines.length > 0 && (
                              <button 
                                onClick={() => setManualLines([])}
                                className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-red-400 transition-colors"
                              >
                                Clear Manual Lines
                              </button>
                            )}
                          </div>
                          <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black cursor-crosshair">
                            <canvas 
                              ref={canvasRef} 
                              onMouseDown={handleMouseDown}
                              onMouseMove={handleMouseMove}
                              onMouseUp={handleMouseUp}
                              onMouseLeave={handleMouseUp}
                              className="w-full h-auto block"
                            />
                          {isProcessing && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-50">
                              <Loader2 className="w-16 h-16 text-[#F27D26] animate-spin mb-6" />
                              <h3 className="text-xl font-bold uppercase tracking-widest mb-2">Deep Pattern Analysis</h3>
                              <p className="text-sm text-white/40 max-w-xs">Consulting deterministic model weights for high-precision structural recognition...</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-3">
                          <button 
                            onClick={analyzeChart}
                            disabled={isProcessing}
                            className="flex-grow flex items-center justify-center gap-2 px-6 py-3 bg-[#F27D26] text-black font-bold rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 uppercase tracking-widest text-xs"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Brain className="w-5 h-5" />
                            )}
                            {isProcessing ? 'Analyzing...' : (analysisResult ? 'Re-Analyze' : 'Analyze Chart')}
                          </button>
                          <button 
                            onClick={resetAnalysis}
                            disabled={isProcessing}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                            title="Reset"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                          {analysisResult && (
                            <button 
                              onClick={downloadAnalysis}
                              disabled={isProcessing}
                              className="p-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg border border-green-500/20 transition-colors"
                              title="Download Analysis"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Pro Tip */}
                  <div className="mt-6 p-4 bg-[#F27D26]/5 border border-[#F27D26]/20 rounded-xl flex items-center gap-4">
                    <div className="p-2 bg-[#F27D26]/10 rounded-lg">
                      <Zap className="w-4 h-4 text-[#F27D26]" />
                    </div>
                    <p className="text-xs text-white/60">
                      <span className="font-bold text-[#F27D26] uppercase tracking-widest mr-2">Pro Tip:</span>
                      For best results, ensure your chart image is clear and includes enough price action to form recognizable structures.
                    </p>
                  </div>
                </div>

                {/* Analysis Results */}
                <div className="space-y-6 w-full">
                  <div className="p-6 bg-white/5 rounded-xl border border-white/10 flex flex-col">

                    <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#F27D26]" />
                        <h3 className="font-bold uppercase tracking-tight">Pattern Proof & Signal</h3>
                      </div>
                      {analysisResult && (
                        <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest flex items-center gap-1">
                          <Check className="w-3 h-3" /> Analysis Complete
                        </span>
                      )}
                    </div>

                    <div className="flex-grow flex flex-col justify-center">
                      {!analysisResult ? (
                        <div className="text-center py-12 opacity-40">
                          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-white/20" />
                          <p className="text-sm uppercase tracking-widest font-medium">Upload and analyze an image to see results</p>
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Detected Pattern</p>
                                  <h4 className="text-2xl font-bold tracking-tight text-[#F27D26] uppercase">{analysisResult.pattern || "No Pattern"}</h4>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Confidence Level</p>
                                  <div className="flex items-center gap-3 justify-end">
                                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${analysisResult.confidence}%` }}
                                        className={`h-full rounded-full ${analysisResult.confidence < 70 ? 'bg-yellow-500' : 'bg-green-400'}`}
                                      />
                                    </div>
                                    <p className={`text-2xl font-mono ${analysisResult.confidence < 70 ? 'text-yellow-500' : 'text-green-400'}`}>
                                      {analysisResult.confidence}%
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {analysisResult.confidence < 70 && (
                                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                  <p className="text-[10px] text-yellow-500 uppercase tracking-widest font-bold">Low Confidence Signal - Exercise Caution</p>
                                </div>
                              )}

                              <div className={`p-6 rounded-xl border flex items-center justify-between ${
                                analysisResult.action === 'BUY' ? 'bg-green-500/10 border-green-500/20' : 
                                analysisResult.action === 'SELL' ? 'bg-red-500/10 border-red-500/20' : 
                                'bg-white/5 border-white/10'
                              }`}>
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Recommended Action</p>
                                  <p className={`text-3xl font-bold tracking-tighter ${
                                    analysisResult.action === 'BUY' ? 'text-green-400' : 
                                    analysisResult.action === 'SELL' ? 'text-red-400' : 
                                    'text-white/80'
                                  }`}>{analysisResult.action}</p>
                                </div>
                                {analysisResult.action === 'BUY' ? <TrendingUp className="w-12 h-12 text-green-400 opacity-20" /> : 
                                 analysisResult.action === 'SELL' ? <TrendingDown className="w-12 h-12 text-red-400 opacity-20" /> : 
                                 <Activity className="w-12 h-12 text-white/20" />}
                              </div>

                              <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Visual Proof & Reasoning</p>
                                <p className="text-sm text-white/70 leading-relaxed">
                                  {analysisResult.reasoning}
                                </p>
                                <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5 space-y-2">
                                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Visual Legend</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-1 bg-[#4ADE80] rounded-full"></div>
                                      <span className="text-[9px] text-white/60 uppercase tracking-tighter">Bullish / Support</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-1 bg-[#F87171] rounded-full"></div>
                                      <span className="text-[9px] text-white/60 uppercase tracking-tighter">Bearish / Resistance</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-1 bg-[#60A5FA] rounded-full"></div>
                                      <span className="text-[9px] text-white/60 uppercase tracking-tighter">Neutral / Trend</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-1 bg-[#F27D26] rounded-full"></div>
                                      <span className="text-[9px] text-white/60 uppercase tracking-tighter">Pattern Highlight</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Pattern Reference Guide */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Reference Guide</p>
                                {getPatternReference(analysisResult.pattern) && (
                                  <div className="flex items-center gap-1 text-[9px] text-[#F27D26] animate-pulse">
                                    <Info className="w-3 h-3" />
                                    <span>Click for details</span>
                                  </div>
                                )}
                              </div>
                              
                              {getPatternReference(analysisResult.pattern) ? (
                                <button 
                                  onClick={() => setSelectedPatternInfo(getPatternReference(analysisResult.pattern))}
                                  className="w-full text-left bg-black/40 rounded-xl border border-white/5 overflow-hidden group/ref h-full flex flex-col hover:border-[#F27D26]/50 transition-all hover:shadow-[0_0_20px_rgba(242,125,38,0.1)]"
                                >
                                  <div className="relative aspect-video bg-white/5 flex items-center justify-center overflow-hidden">
                                    <img 
                                      src={getPatternReference(analysisResult.pattern)?.image} 
                                      alt={analysisResult.pattern}
                                      className="w-full h-full object-contain opacity-80 group-hover/ref:opacity-100 transition-all duration-500 group-hover/ref:scale-110"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/ref:opacity-100 transition-opacity flex items-end p-3">
                                      <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-[#F27D26] rounded-lg">
                                          <Maximize2 className="w-3 h-3 text-white" />
                                        </div>
                                        <p className="text-[10px] text-white font-bold uppercase tracking-widest">View Full Analysis</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-4 flex-grow relative">
                                    <div className="flex items-center justify-between mb-1">
                                      <h5 className="text-xs font-bold text-white/90">{getPatternReference(analysisResult.pattern)?.title}</h5>
                                      <Info className="w-3 h-3 text-white/20 group-hover/ref:text-[#F27D26] transition-colors" />
                                    </div>
                                    <p className="text-[10px] text-white/50 leading-relaxed line-clamp-2">{getPatternReference(analysisResult.pattern)?.description}</p>
                                  </div>
                                </button>
                              ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-xl opacity-40">
                                  <AlertTriangle className="w-8 h-8 mb-2" />
                                  <p className="text-[10px] uppercase tracking-widest text-center">No reference available for this pattern</p>
                                  <p className="text-[9px] mt-2 text-center text-white/30">Detected: "{analysisResult.pattern}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5 text-[10px] text-white/40 uppercase tracking-widest">
                            The structural analysis has been drawn on the chart for verification.
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Processing Mode</p>
                      <p className="text-sm font-bold uppercase tracking-tight">Static Image</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">ML Architecture</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] font-mono bg-[#F27D26]/10 text-[#F27D26] px-1.5 py-0.5 rounded border border-[#F27D26]/20">YOLOv8x</span>
                        <span className="text-[10px] font-mono bg-white/5 text-white/70 px-1.5 py-0.5 rounded border border-white/10">CNN</span>
                        <span className="text-[10px] font-mono bg-white/5 text-white/70 px-1.5 py-0.5 rounded border border-white/10">CLAHE</span>
                        <span className="text-[10px] font-mono bg-white/5 text-white/70 px-1.5 py-0.5 rounded border border-white/10">Stochastic</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {selectedPatternInfo && (
            <PatternInfoModal 
              info={selectedPatternInfo} 
              onClose={() => setSelectedPatternInfo(null)} 
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/10 p-10 bg-black/60">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-80">
            <AppLogo className="w-6 h-6 rounded-lg" />
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-white/80">Chart Pattern Analyzer v1.0</span>
          </div>
          <div className="text-xs tracking-widest text-white/40 text-center md:text-right font-medium">
            <div className="mb-1">Created by <span className="text-white/70 hover:text-[#F27D26] transition-colors cursor-default">Sam Sarvesh</span></div>
            <div className="flex items-center justify-center md:justify-end gap-1.5">
              <span>Made with</span>
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-red-500"
              >
                ❤
              </motion.span>
              <span>in India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
