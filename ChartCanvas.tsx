import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Candle,
  StrategyAnalysisResult,
  ChartOverlaySettings,
  Timeframe,
} from '../types';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Sliders,
  Target,
  Maximize2,
} from 'lucide-react';

interface ChartCanvasProps {
  candles: Candle[];
  analysis: StrategyAnalysisResult;
  timeframe: Timeframe;
  overlaySettings: ChartOverlaySettings;
  onUpdateSettings: (newSettings: Partial<ChartOverlaySettings>) => void;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  candles,
  analysis,
  timeframe,
  overlaySettings,
  onUpdateSettings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport transformation state
  const [viewOffset, setViewOffset] = useState<number>(0); // how many candles from the right
  const [candleWidth, setCandleWidth] = useState<number>(10); // width per candle in px
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartOffset, setDragStartOffset] = useState<number>(0);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; active: boolean } | null>(null);
  const [showOverlayMenu, setShowOverlayMenu] = useState<boolean>(false);

  // Responsive canvas sizing
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 520,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 50 && height > 50) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Main drawing engine
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Margins
    const priceAxisWidth = 80;
    const timeAxisHeight = 24;
    const chartWidth = width - priceAxisWidth;
    const chartHeight = height - timeAxisHeight;

    // Background
    ctx.fillStyle = '#131722';
    ctx.fillRect(0, 0, width, height);

    // Compute visible candle slice
    const visibleCount = Math.ceil(chartWidth / candleWidth) + 4;
    const rightMarginCandles = 5; // space on right for price projection
    const endIndex = Math.max(0, candles.length - 1 - viewOffset);
    const startIndex = Math.max(0, endIndex - visibleCount);
    const visibleCandles = candles.slice(startIndex, endIndex + 1);

    if (visibleCandles.length === 0) return;

    // Price scaling: find min & max price in visible range (plus strategy levels)
    let minPrice = Math.min(...visibleCandles.map((c) => c.low));
    let maxPrice = Math.max(...visibleCandles.map((c) => c.high));

    // Include Fib levels & Std Dev in bounds if enabled
    if (overlaySettings.showFibonacci && analysis.fibonacciLevels.length > 0) {
      const activeFibs = analysis.fibonacciLevels.filter((f) => f.ratio >= -4.5 && f.ratio <= 1.0);
      activeFibs.forEach((f) => {
        minPrice = Math.min(minPrice, f.price);
        maxPrice = Math.max(maxPrice, f.price);
      });
    }

    if (overlaySettings.showStdDevZones && analysis.standardDeviationZones.length > 0) {
      analysis.standardDeviationZones.forEach((z) => {
        minPrice = Math.min(minPrice, z.lowerPrice);
        maxPrice = Math.max(maxPrice, z.upperPrice);
      });
    }

    if (analysis.signal !== 'NO_TRADE' && analysis.stopLoss && analysis.takeProfit) {
      minPrice = Math.min(minPrice, analysis.stopLoss);
      maxPrice = Math.max(maxPrice, analysis.takeProfit);
    }

    // Add 8% vertical padding
    const priceRange = maxPrice - minPrice || 10;
    minPrice -= priceRange * 0.08;
    maxPrice += priceRange * 0.08;
    const adjustedRange = maxPrice - minPrice;

    const priceToY = (price: number) => {
      return chartHeight - ((price - minPrice) / adjustedRange) * chartHeight;
    };

    const yToPrice = (y: number) => {
      return maxPrice - (y / chartHeight) * adjustedRange;
    };

    const indexToX = (index: number) => {
      const posFromRight = (candles.length - 1 - index - viewOffset + rightMarginCandles);
      return chartWidth - posFromRight * candleWidth;
    };

    // Draw Grid Lines
    ctx.strokeStyle = '#1e222d';
    ctx.lineWidth = 1;

    // Horizontal price grid
    const priceStep = Math.max(1, Math.round((adjustedRange / 8) * 10) / 10);
    const startPrice = Math.ceil(minPrice / priceStep) * priceStep;

    for (let p = startPrice; p <= maxPrice; p += priceStep) {
      const y = priceToY(p);
      if (y >= 0 && y <= chartHeight) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();

        // Price Axis Label
        ctx.fillStyle = '#80848e';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(p.toFixed(2), chartWidth + 6, y + 3.5);
      }
    }

    // Vertical time grid
    const timeStepCandles = Math.max(5, Math.floor(chartWidth / (candleWidth * 8)));
    for (let i = startIndex; i <= endIndex; i += timeStepCandles) {
      const x = indexToX(i);
      const c = candles[i];
      if (x >= 0 && x <= chartWidth && c) {
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = '#1e222d';
        ctx.moveTo(x, 0);
        ctx.lineTo(x, chartHeight);
        ctx.stroke();

        // Time label
        const date = new Date(c.time * 1000);
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        ctx.fillStyle = '#80848e';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x, chartHeight + 16);
      }
    }

    // 1. REVERSAL ZONE HIGHLIGHTING (-2.25 to -2.50 Primary & -4.00 to -4.50 Deep)
    if (overlaySettings.showFibonacci && analysis.reversalZone) {
      const rz = analysis.reversalZone;
      const yTop = priceToY(rz.upperPrice);
      const yBottom = priceToY(rz.lowerPrice);
      const zoneHeight = Math.max(6, Math.abs(yBottom - yTop));
      const topY = Math.min(yTop, yBottom);

      const isBuyReversal = rz.type === 'DISCOUNT_BUY_REVERSAL';
      ctx.fillStyle = isBuyReversal ? 'rgba(8, 153, 129, 0.09)' : 'rgba(242, 54, 69, 0.09)';
      ctx.fillRect(0, topY, chartWidth, zoneHeight);

      ctx.strokeStyle = isBuyReversal ? 'rgba(8, 153, 129, 0.6)' : 'rgba(242, 54, 69, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(0, topY, chartWidth, zoneHeight);

      // Reversal Zone Tag
      ctx.fillStyle = isBuyReversal ? '#089981' : '#f23645';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `🎯 REVERSAL ZONE (${rz.primaryFibRange} • $${rz.lowerPrice.toFixed(2)} - $${rz.upperPrice.toFixed(2)})`,
        12,
        topY + 12
      );
    }

    // 2. STANDARD DEVIATION ZONES (Upper Selling / Lower Buying Zones)
    if (overlaySettings.showStdDevZones && analysis.standardDeviationZones.length > 0) {
      analysis.standardDeviationZones.forEach((zone) => {
        const yTop = priceToY(Math.max(zone.upperPrice, zone.lowerPrice));
        const yBottom = priceToY(Math.min(zone.upperPrice, zone.lowerPrice));
        const zoneHeight = Math.max(4, yBottom - yTop);

        if (zone.type === 'BUYING_ZONE') {
          ctx.fillStyle = 'rgba(8, 153, 129, 0.03)';
          ctx.fillRect(0, yTop, chartWidth, zoneHeight);
          ctx.strokeStyle = 'rgba(8, 153, 129, 0.25)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(0, yTop, chartWidth, zoneHeight);

          ctx.fillStyle = '#089981';
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`STD DEV BUYING ZONE (${zone.name})`, 12, yTop + 11);
        } else if (zone.type === 'SELLING_CEILING_ZONE') {
          ctx.fillStyle = 'rgba(242, 54, 69, 0.03)';
          ctx.fillRect(0, yTop, chartWidth, zoneHeight);
          ctx.strokeStyle = 'rgba(242, 54, 69, 0.25)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(0, yTop, chartWidth, zoneHeight);

          ctx.fillStyle = '#f23645';
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`STD DEV CEILING ZONE (${zone.name})`, 12, yTop + 11);
        }
      });
    }

    // 3. ACCUMULATION RECTANGLE & ZONE
    if (overlaySettings.showAccumulation && analysis.accumulation && analysis.accumulation.isFormed) {
      const accum = analysis.accumulation;
      const xStart = indexToX(accum.startIndex);
      const xEnd = indexToX(accum.endIndex);
      const yHigh = priceToY(accum.high);
      const yLow = priceToY(accum.low);
      const rectWidth = Math.max(20, xEnd - xStart);
      const rectHeight = Math.max(10, yLow - yHigh);

      // Box background
      ctx.fillStyle = 'rgba(128, 132, 142, 0.08)';
      ctx.fillRect(xStart, yHigh, rectWidth, rectHeight);

      // Border
      ctx.strokeStyle = 'rgba(128, 132, 142, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(xStart, yHigh, rectWidth, rectHeight);

      // Header Tag
      ctx.fillStyle = '#80848e';
      ctx.font = '600 10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`1. ACCUMULATION ZONE ($${accum.low.toFixed(2)} - $${accum.high.toFixed(2)})`, xStart + 8, yHigh + 15);

      // Mean Equilibrium Line
      const yMean = priceToY(accum.mean);
      ctx.strokeStyle = 'rgba(128, 132, 142, 0.35)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(xStart, yMean);
      ctx.lineTo(xEnd, yMean);
      ctx.stroke();
    }

    // 4. MANIPULATION RECTANGLE
    if (overlaySettings.showManipulation && analysis.manipulation && analysis.manipulation.isFormed) {
      const manip = analysis.manipulation;
      const xStart = indexToX(manip.startIndex);
      const xEnd = indexToX(manip.endIndex);
      const yHigh = priceToY(manip.high);
      const yLow = priceToY(manip.low);
      const rectWidth = Math.max(16, xEnd - xStart);
      const rectHeight = Math.max(10, yLow - yHigh);

      ctx.fillStyle = 'rgba(242, 54, 69, 0.08)';
      ctx.fillRect(xStart, yHigh, rectWidth, rectHeight);

      ctx.strokeStyle = 'rgba(242, 54, 69, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(xStart, yHigh, rectWidth, rectHeight);

      ctx.fillStyle = '#f23645';
      ctx.font = '600 10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('2. MANIPULATION ZONE', xStart + 8, yHigh + 15);
    }

    // 5. MANIPULATION LEG (VECTOR & HIGH / LOW LEVELS)
    if (overlaySettings.showManipulationLeg && analysis.manipulationLeg && analysis.manipulationLeg.identified) {
      const leg = analysis.manipulationLeg;
      const yHigh = priceToY(leg.highPrice);
      const yLow = priceToY(leg.lowPrice);

      // Manipulation Leg Vector Line connecting the move
      if (analysis.manipulation) {
        const xStart = indexToX(analysis.manipulation.startIndex);
        const xEnd = indexToX(analysis.manipulation.endIndex);
        const yStart = leg.direction === 'BEARISH' ? yHigh : yLow;
        const yEnd = leg.direction === 'BEARISH' ? yLow : yHigh;

        ctx.strokeStyle = '#ffb119';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();

        // Manipulation Leg Label
        const midX = (xStart + xEnd) / 2;
        const midY = (yStart + yEnd) / 2;
        ctx.fillStyle = '#ffb119';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`MANIPULATION LEG ($${leg.range.toFixed(2)})`, midX, midY - 6);
      }

      // Manipulation High Line
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#f23645';
      ctx.beginPath();
      ctx.moveTo(0, yHigh);
      ctx.lineTo(chartWidth, yHigh);
      ctx.stroke();

      // Manipulation Low Line
      ctx.strokeStyle = '#089981';
      ctx.beginPath();
      ctx.moveTo(0, yLow);
      ctx.lineTo(chartWidth, yLow);
      ctx.stroke();

      // High / Low Badges
      ctx.fillStyle = '#f23645';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`MANIP HIGH: $${leg.highPrice.toFixed(2)}`, chartWidth - 8, yHigh - 5);

      ctx.fillStyle = '#089981';
      ctx.fillText(`MANIP LOW: $${leg.lowPrice.toFixed(2)}`, chartWidth - 8, yLow + 14);
    }

    // 6. DISTRIBUTION RECTANGLE
    if (overlaySettings.showDistribution && analysis.distribution) {
      const dist = analysis.distribution;
      const xStart = indexToX(dist.startIndex);
      const xEnd = indexToX(dist.endIndex);
      const yHigh = priceToY(dist.high);
      const yLow = priceToY(dist.low);
      const rectWidth = Math.max(16, xEnd - xStart);
      const rectHeight = Math.max(10, yLow - yHigh);

      ctx.fillStyle = 'rgba(41, 98, 255, 0.08)';
      ctx.fillRect(xStart, yHigh, rectWidth, rectHeight);

      ctx.strokeStyle = 'rgba(41, 98, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(xStart, yHigh, rectWidth, rectHeight);

      ctx.fillStyle = '#2962ff';
      ctx.font = '600 10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('4. DISTRIBUTION ZONE', xStart + 8, yHigh + 15);
    }

    // 7. PREVIOUS LIQUIDITY & LIQUIDITY SWEEP/BREAK
    if (overlaySettings.showLiquidity && analysis.liquidityLevels.length > 0) {
      analysis.liquidityLevels.forEach((lvl) => {
        const y = priceToY(lvl.price);
        if (y < 0 || y > chartHeight) return;

        ctx.setLineDash([2, 2]);
        if (lvl.type === 'BSL') {
          ctx.strokeStyle = lvl.swept ? 'rgba(41, 98, 255, 0.85)' : 'rgba(242, 54, 69, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(chartWidth, y);
          ctx.stroke();

          if (lvl.swept) {
            ctx.fillStyle = '#2962ff';
            ctx.beginPath();
            ctx.arc(60, y, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = 'bold 9px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`⚡ 3. LIQUIDITY SWEEP/BREAK: BSL ($${lvl.price.toFixed(2)})`, 70, y + 3.5);
          } else {
            ctx.fillStyle = '#f23645';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`PREVIOUS LIQUIDITY BSL ($${lvl.price.toFixed(2)})`, 12, y - 3);
          }
        } else {
          ctx.strokeStyle = lvl.swept ? 'rgba(8, 153, 129, 0.85)' : 'rgba(8, 153, 129, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(chartWidth, y);
          ctx.stroke();

          if (lvl.swept) {
            ctx.fillStyle = '#089981';
            ctx.beginPath();
            ctx.arc(60, y, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = 'bold 9px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`⚡ 3. LIQUIDITY SWEEP/BREAK: SSL ($${lvl.price.toFixed(2)})`, 70, y + 3.5);
          } else {
            ctx.fillStyle = '#089981';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`PREVIOUS LIQUIDITY SSL ($${lvl.price.toFixed(2)})`, 12, y + 11);
          }
        }
      });
    }

    // 8. CUSTOM FIBONACCI LEVELS (-2.25, -2.5, -4, -4.25, -4.5)
    if (overlaySettings.showFibonacci && analysis.fibonacciLevels.length > 0) {
      analysis.fibonacciLevels.forEach((fib) => {
        const y = priceToY(fib.price);
        if (y < 0 || y > chartHeight) return;

        const isKeyReversal = fib.ratio === -2.5 || fib.ratio === -2.25;
        const isDeepExtension = fib.ratio === -4.0 || fib.ratio === -4.25 || fib.ratio === -4.5;

        ctx.strokeStyle = isKeyReversal ? '#ffb119' : isDeepExtension ? '#2962ff' : '#80848e';
        ctx.lineWidth = isKeyReversal ? 1.2 : 0.6;
        ctx.setLineDash(isKeyReversal ? [4, 2] : [2, 4]);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();

        // Right side tag
        ctx.fillStyle = isKeyReversal ? '#ffb119' : isDeepExtension ? '#2962ff' : '#d1d4dc';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`FIB ${fib.label} ($${fib.price.toFixed(2)})`, chartWidth - 8, y - 3);
      });
    }

    // 8. CANDLESTICKS RENDERING
    ctx.setLineDash([]);
    const barSpacing = Math.max(1, candleWidth * 0.2);
    const bodyWidth = Math.max(2, candleWidth - barSpacing);

    visibleCandles.forEach((c, i) => {
      const globalIndex = startIndex + i;
      const x = indexToX(globalIndex);
      const isUp = c.close >= c.open;

      const yOpen = priceToY(c.open);
      const yClose = priceToY(c.close);
      const yHigh = priceToY(c.high);
      const yLow = priceToY(c.low);

      const color = isUp ? '#089981' : '#f23645';
      const wickColor = isUp ? '#089981' : '#f23645';

      // Draw Wick
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Draw Body
      ctx.fillStyle = color;
      const topY = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
      ctx.fillRect(x - bodyWidth / 2, topY, bodyWidth, bodyHeight);
    });

    // 9. SIGNAL CALLOUT (BUY / SELL WITH SL & TP BRACKETS)
    if (overlaySettings.showSignals && analysis.signal !== 'NO_TRADE' && analysis.entryPrice && analysis.stopLoss && analysis.takeProfit) {
      const entryY = priceToY(analysis.entryPrice);
      const slY = priceToY(analysis.stopLoss);
      const tpY = priceToY(analysis.takeProfit);
      const lastCandleX = indexToX(candles.length - 1);

      // Stop Loss line & tag
      ctx.strokeStyle = '#f23645';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(lastCandleX - 40, slY);
      ctx.lineTo(chartWidth, slY);
      ctx.stroke();

      ctx.fillStyle = '#f23645';
      ctx.fillRect(chartWidth - 85, slY - 8, 80, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`SL ${analysis.stopLoss.toFixed(2)}`, chartWidth - 45, slY + 3.5);

      // Take Profit line & tag
      ctx.strokeStyle = '#089981';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lastCandleX - 40, tpY);
      ctx.lineTo(chartWidth, tpY);
      ctx.stroke();

      ctx.fillStyle = '#089981';
      ctx.fillRect(chartWidth - 85, tpY - 8, 80, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`TP ${analysis.takeProfit.toFixed(2)}`, chartWidth - 45, tpY + 3.5);

      // Entry Badge
      const isBuy = analysis.signal === 'BUY';
      const badgeY = isBuy ? priceToY(analysis.entryPrice) + 20 : priceToY(analysis.entryPrice) - 20;

      ctx.fillStyle = isBuy ? '#089981' : '#f23645';
      ctx.beginPath();
      ctx.roundRect(lastCandleX - 30, badgeY - 10, 60, 20, 3);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isBuy ? 'BUY' : 'SELL', lastCandleX, badgeY + 4);
    }

    // 10. CURRENT LIVE PRICE LINE & BADGE
    const currentPrice = analysis.currentPrice;
    const currentY = priceToY(currentPrice);

    if (currentY >= 0 && currentY <= chartHeight) {
      ctx.strokeStyle = '#ffb119';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(chartWidth, currentY);
      ctx.stroke();

      // Right Axis Price Tag
      ctx.fillStyle = '#ffb119';
      ctx.fillRect(chartWidth + 2, currentY - 9, priceAxisWidth - 4, 18);
      ctx.fillStyle = '#131722';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${currentPrice.toFixed(2)}`, chartWidth + 5, currentY + 3.5);
    }

    // 11. CROSSHAIR & TOOLTIP
    if (overlaySettings.showCrosshair && crosshair && crosshair.active && crosshair.x < chartWidth && crosshair.y < chartHeight) {
      ctx.strokeStyle = 'rgba(209, 212, 220, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 2]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crosshair.x, 0);
      ctx.lineTo(crosshair.x, chartHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, crosshair.y);
      ctx.lineTo(chartWidth, crosshair.y);
      ctx.stroke();

      // Price Tag on crosshair Y
      const hoverPrice = yToPrice(crosshair.y);
      ctx.fillStyle = '#2a2e39';
      ctx.fillRect(chartWidth + 2, crosshair.y - 9, priceAxisWidth - 4, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${hoverPrice.toFixed(2)}`, chartWidth + 5, crosshair.y + 3.5);

      // Find nearest candle
      const candleIdxFromRight = Math.round((chartWidth - crosshair.x) / candleWidth) - rightMarginCandles;
      const targetIndex = candles.length - 1 - viewOffset - candleIdxFromRight;

      if (targetIndex >= 0 && targetIndex < candles.length) {
        const hoverCandle = candles[targetIndex];
        // Time badge
        const d = new Date(hoverCandle.time * 1000);
        const timeBadge = `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        ctx.fillStyle = '#2a2e39';
        ctx.fillRect(crosshair.x - 26, chartHeight + 2, 52, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeBadge, crosshair.x, chartHeight + 14);

        // OHLC Tooltip in top left
        ctx.fillStyle = 'rgba(19, 23, 34, 0.9)';
        ctx.fillRect(8, 8, 300, 24);
        ctx.strokeStyle = '#2a2e39';
        ctx.strokeRect(8, 8, 300, 24);

        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#80848e';
        ctx.fillText('O:', 14, 24);
        ctx.fillStyle = hoverCandle.close >= hoverCandle.open ? '#089981' : '#f23645';
        ctx.fillText(`${hoverCandle.open.toFixed(2)}`, 28, 24);

        ctx.fillStyle = '#80848e';
        ctx.fillText('H:', 84, 24);
        ctx.fillStyle = hoverCandle.close >= hoverCandle.open ? '#089981' : '#f23645';
        ctx.fillText(`${hoverCandle.high.toFixed(2)}`, 98, 24);

        ctx.fillStyle = '#80848e';
        ctx.fillText('L:', 154, 24);
        ctx.fillStyle = hoverCandle.close >= hoverCandle.open ? '#089981' : '#f23645';
        ctx.fillText(`${hoverCandle.low.toFixed(2)}`, 168, 24);

        ctx.fillStyle = '#80848e';
        ctx.fillText('C:', 224, 24);
        ctx.fillStyle = hoverCandle.close >= hoverCandle.open ? '#089981' : '#f23645';
        ctx.fillText(`${hoverCandle.close.toFixed(2)}`, 238, 24);
      }
    }
  }, [dimensions, candles, analysis, timeframe, overlaySettings, viewOffset, candleWidth, crosshair]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse & Touch event handlers for Zoom & Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartOffset(viewOffset);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setCrosshair({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      });
    }

    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    const deltaCandles = Math.round(deltaX / candleWidth);
    const newOffset = Math.max(0, Math.min(candles.length - 10, dragStartOffset + deltaCandles));
    setViewOffset(newOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setCrosshair(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // Zoom in
      setCandleWidth((prev) => Math.min(32, prev * 1.15));
    } else {
      // Zoom out
      setCandleWidth((prev) => Math.max(3, prev / 1.15));
    }
  };

  const handleZoomIn = () => setCandleWidth((prev) => Math.min(32, prev * 1.25));
  const handleZoomOut = () => setCandleWidth((prev) => Math.max(3, prev / 1.25));
  const handleResetView = () => {
    setViewOffset(0);
    setCandleWidth(10);
  };

  return (
    <div id="chart-container-root" ref={containerRef} className="relative w-full h-full bg-[#131722] flex flex-col select-none overflow-hidden">
      {/* Chart Top Sub-Bar Controls */}
      <div id="chart-toolbar" className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e222d] bg-[#131722] text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-white font-mono tracking-wide text-xs">XAU/USD Gold Spot</span>
          <span className="text-[#80848e] text-[10px]">•</span>
          <span className="bg-[#2a2e39] text-[#d1d4dc] px-1.5 py-0.5 rounded font-mono text-[10px]">
            {timeframe}
          </span>
          <span className="text-[#80848e] text-[10px]">•</span>
          <span className="text-[#ffb119] font-mono font-bold text-xs">
            {analysis.currentPrice.toFixed(2)}
          </span>
        </div>

        {/* Action icons & overlay controls */}
        <div className="flex items-center space-x-1">
          {/* Overlay layers dropdown toggle */}
          <div className="relative">
            <button
              id="chart-layers-button"
              onClick={() => setShowOverlayMenu(!showOverlayMenu)}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded transition-colors text-[11px] font-medium border ${
                showOverlayMenu ? 'bg-[#ffb119] text-black font-bold border-[#ffb119]' : 'bg-[#2a2e39]/60 hover:bg-[#2a2e39] text-[#d1d4dc] border-[#2a2e39]'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Layers</span>
            </button>

            {/* Overlay Layers Popup */}
            {showOverlayMenu && (
              <div
                id="chart-layers-dropdown"
                className="absolute right-0 top-7 z-50 w-60 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-2xl p-3 space-y-2 text-xs text-[#d1d4dc]"
              >
                <div className="font-semibold text-[#80848e] pb-1 border-b border-[#2a2e39] flex justify-between items-center text-[10px] uppercase tracking-wider">
                  <span>Strategy Overlays</span>
                  <span className="text-[#ffb119] font-mono font-bold">AMD ENGINE</span>
                </div>

                <label className="flex items-center justify-between cursor-pointer hover:text-white">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-sm bg-[#80848e] inline-block" />
                    <span>Accumulation Range</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={overlaySettings.showAccumulation}
                    onChange={(e) => onUpdateSettings({ showAccumulation: e.target.checked })}
                    className="accent-[#80848e]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:text-white">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-sm bg-[#f23645] inline-block" />
                    <span>Manipulation Zone</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={overlaySettings.showManipulation}
                    onChange={(e) => onUpdateSettings({ showManipulation: e.target.checked })}
                    className="accent-[#f23645]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:text-white">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-sm bg-[#2962ff] inline-block" />
                    <span>Distribution Area</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={overlaySettings.showDistribution}
                    onChange={(e) => onUpdateSettings({ showDistribution: e.target.checked })}
                    className="accent-[#2962ff]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:text-white">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-sm bg-[#ffb119] inline-block" />
                    <span>Fibonacci (-2.25 to -4.5)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={overlaySettings.showFibonacci}
                    onChange={(e) => onUpdateSettings({ showFibonacci: e.target.checked })}
                    className="accent-[#ffb119]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:text-white">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-sm bg-[#089981] inline-block" />
                    <span>Std Dev Buy/Sell Zones</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={overlaySettings.showStdDevZones}
                    onChange={(e) => onUpdateSettings({ showStdDevZones: e.target.checked })}
                    className="accent-[#089981]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:text-white">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-sm bg-[#2962ff] inline-block" />
                    <span>Liquidity Pools (BSL/SSL)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={overlaySettings.showLiquidity}
                    onChange={(e) => onUpdateSettings({ showLiquidity: e.target.checked })}
                    className="accent-[#2962ff]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:text-white">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-sm bg-[#089981] inline-block" />
                    <span>Signals & SL/TP Brackets</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={overlaySettings.showSignals}
                    onChange={(e) => onUpdateSettings({ showSignals: e.target.checked })}
                    className="accent-[#089981]"
                  />
                </label>
              </div>
            )}
          </div>

          <button
            id="chart-zoom-in"
            onClick={handleZoomIn}
            className="p-1 bg-[#2a2e39]/60 hover:bg-[#2a2e39] text-[#80848e] hover:text-white rounded border border-[#2a2e39] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            id="chart-zoom-out"
            onClick={handleZoomOut}
            className="p-1 bg-[#2a2e39]/60 hover:bg-[#2a2e39] text-[#80848e] hover:text-white rounded border border-[#2a2e39] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            id="chart-reset-view"
            onClick={handleResetView}
            className="p-1 bg-[#2a2e39]/60 hover:bg-[#2a2e39] text-[#80848e] hover:text-white rounded border border-[#2a2e39] transition-colors"
            title="Reset Chart View"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative flex-1 w-full h-full cursor-crosshair">
        {candles.length === 0 && (
          <div
            id="chart-disconnected-overlay"
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#131722]/95 backdrop-blur-sm z-10 p-6 text-center space-y-3"
          >
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f23645] animate-ping" />
              <span className="text-sm font-bold font-mono tracking-wide text-[#f23645]">
                LIVE DATA DISCONNECTED — SIGNALS PAUSED
              </span>
            </div>
            <p className="text-xs text-[#80848e] max-w-md">
              Waiting for live real-time XAU/USD market data feed from Twelve Data. Trading signals and prediction calculations are paused until real market ticks arrive.
            </p>
          </div>
        )}

        <canvas
          id="xau-candlestick-canvas"
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* Floating Quick Legend / Strategy Pill in Top Right corner */}
        <div id="chart-legend-overlay" className="absolute top-2.5 right-3 pointer-events-none flex flex-col items-end space-y-1 opacity-90">
          <div className="bg-[#1e222d]/90 backdrop-blur-md border border-[#2a2e39] px-2 py-0.5 rounded text-[10px] font-mono text-[#d1d4dc] flex items-center space-x-1.5 shadow-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${analysis.signal === 'BUY' ? 'bg-[#089981]' : analysis.signal === 'SELL' ? 'bg-[#f23645]' : 'bg-[#ffb119]'} animate-pulse`} />
            <span className="text-[#80848e]">Phase {analysis.currentPhaseNumber || 1}/6:</span>
            <span className="font-semibold text-white">
              {analysis.currentPhase || 'Accumulation'}
            </span>
          </div>

          {analysis.liquiditySweepBreak?.isSwept && (
            <div className="bg-[#1e222d]/90 backdrop-blur-md border border-[#2962ff]/40 px-2 py-0.5 rounded text-[9px] font-mono text-[#2962ff]">
              ⚡ Swept {analysis.liquiditySweepBreak.type} @ ${analysis.liquiditySweepBreak.price.toFixed(2)}
            </div>
          )}

          {analysis.reversalZone && (
            <div className="bg-[#1e222d]/90 backdrop-blur-md border border-[#ffb119]/40 px-2 py-0.5 rounded text-[9px] font-mono text-[#ffb119]">
              🎯 Fib Reversal: {analysis.reversalZone.primaryFibRange}
            </div>
          )}
        </div>

        {/* Floating HUD Pill Group in Bottom Left (from High Density layout) */}
        <div id="chart-hud-pills" className="absolute bottom-6 left-3 pointer-events-none hidden sm:flex items-center space-x-1.5 opacity-90">
          <div className="bg-[#1e222d]/90 backdrop-blur-sm border border-[#2a2e39] px-2 py-0.5 rounded text-[10px] flex items-center space-x-1.5">
            <span className="text-[#80848e]">R:R</span>
            <span className="text-white font-mono font-bold">1:2.0</span>
          </div>
          <div className="bg-[#1e222d]/90 backdrop-blur-sm border border-[#2a2e39] px-2 py-0.5 rounded text-[10px] flex items-center space-x-1.5">
            <span className="text-[#80848e]">Risk Amount</span>
            <span className="text-[#f23645] font-mono font-bold">$2.00</span>
          </div>
          <div className="bg-[#1e222d]/90 backdrop-blur-sm border border-[#2a2e39] px-2 py-0.5 rounded text-[10px] flex items-center space-x-1.5">
            <span className="text-[#80848e]">Target Profit</span>
            <span className="text-[#089981] font-mono font-bold">$4.00</span>
          </div>
        </div>
      </div>
    </div>
  );
};
