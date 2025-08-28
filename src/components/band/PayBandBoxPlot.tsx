'use client'

import React from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { formatKoreanCurrency } from '@/lib/utils'

interface BoxPlotData {
  level: string
  // 시장 데이터 (벤치마크)
  market: {
    min: number
    q1: number      // 25%ile
    median: number  // 50%ile
    q3: number      // 75%ile
    max: number
  }
  // 우리 회사(SBL) 데이터
  company: {
    values: number[]     // 개별 급여들
    median: number       // 우리 회사 중위수 (강조)
    mean: number        // 평균
  }
  // 경쟁사(CA) 데이터
  competitor?: {
    median: number      // 경쟁사 중위수
  }
}

interface PayBandBoxPlotProps {
  bandName: string
  data: BoxPlotData[]
  showCompetitor?: boolean
}

// 커스텀 박스플롯 렌더러 - 각 직급별로 박스플롯을 그림
const CustomBoxPlot = ({ x, y, width, height, data }: any) => {
  if (!data) return null
  
  const { min, q1, median, q3, max } = data
  
  // 박스 너비 (막대 너비의 60%)
  const boxWidth = width * 0.5
  const boxX = x + (width - boxWidth) / 2
  
  return (
    <g>
      {/* Whisker 선 (min to max) */}
      <line
        x1={x + width / 2}
        y1={y + height - (min / max) * height}
        x2={x + width / 2}
        y2={y}
        stroke="#94a3b8"
        strokeWidth={1.5}
        strokeDasharray="2,2"
      />
      
      {/* Min 가로선 */}
      <line
        x1={x + width * 0.3}
        y1={y + height - (min / max) * height}
        x2={x + width * 0.7}
        y2={y + height - (min / max) * height}
        stroke="#64748b"
        strokeWidth={2}
      />
      
      {/* Max 가로선 */}
      <line
        x1={x + width * 0.3}
        y1={y}
        x2={x + width * 0.7}
        y2={y}
        stroke="#64748b"
        strokeWidth={2}
      />
      
      {/* IQR 박스 (Q1-Q3) */}
      <rect
        x={boxX}
        y={y + height - (q3 / max) * height}
        width={boxWidth}
        height={((q3 - q1) / max) * height}
        fill="#dbeafe"
        stroke="#3b82f6"
        strokeWidth={2}
        rx={2}
      />
      
      {/* Median 선 */}
      <line
        x1={boxX}
        y1={y + height - (median / max) * height}
        x2={boxX + boxWidth}
        y2={y + height - (median / max) * height}
        stroke="#1e40af"
        strokeWidth={3}
      />
    </g>
  )
}

export function PayBandBoxPlot({ bandName, data, showCompetitor = false }: PayBandBoxPlotProps) {
  // 데이터가 없으면 빈 차트 표시
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{bandName}</h3>
        <div className="h-[400px] flex items-center justify-center text-gray-500">
          데이터가 없습니다
        </div>
      </div>
    )
  }
  
  // 데이터 변환 - Recharts 형식으로
  const chartData = data.map(item => ({
    level: item.level,
    // 박스플롯 데이터 범위 (더미 값으로 Y축 범위 설정용)
    marketRange: [item.market.min, item.market.max],
    marketMin: item.market.min,
    marketQ1: item.market.q1,
    marketMedian: item.market.median,
    marketQ3: item.market.q3,
    marketMax: item.market.max,
    companyMedian: item.company.median,
    companyMean: item.company.mean,
    competitorMedian: item.competitor?.median
  }))

  // Y축 범위 계산
  const allValues = data.flatMap(d => [
    d.market.min,
    d.market.max,
    d.company.median,
    d.competitor?.median || 0
  ])
  const yMin = Math.min(...allValues) * 0.9
  const yMax = Math.max(...allValues) * 1.1

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.level}</p>
          <div className="mt-2 space-y-1 text-sm">
            <p className="text-gray-600 font-semibold">시장 벤치마크:</p>
            <p>Max: {formatKoreanCurrency(data.marketMax, '만원')}</p>
            <p>75%: {formatKoreanCurrency(data.marketQ3, '만원')}</p>
            <p>50%: {formatKoreanCurrency(data.marketMedian, '만원')}</p>
            <p>25%: {formatKoreanCurrency(data.marketQ1, '만원')}</p>
            <p>Min: {formatKoreanCurrency(data.marketMin, '만원')}</p>
            
            <div className="mt-2 pt-2 border-t">
              <p className="text-blue-600 font-semibold">우리사 (SBL):</p>
              <p>중위수: {formatKoreanCurrency(data.companyMedian, '만원')}</p>
              <p>평균: {formatKoreanCurrency(data.companyMean, '만원')}</p>
              
              {showCompetitor && data.competitorMedian && (
                <>
                  <p className="text-orange-600 font-semibold mt-1">경쟁사 (CA):</p>
                  <p>중위수: {formatKoreanCurrency(data.competitorMedian, '만원')}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{bandName}</h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 50, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          <XAxis 
            dataKey="level" 
            tick={{ fontSize: 12 }}
            label={{ value: '직급', position: 'insideBottom', offset: -5 }}
          />
          
          <YAxis 
            domain={[yMin, yMax]}
            tickFormatter={(value) => `${(value / 10000).toFixed(0)}`}
            label={{ value: '연봉 (만원)', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 11 }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="rect"
          />
          
          {/* 시장 벤치마크 Box Plot - Bar 컴포넌트를 사용하여 각 레벨별로 박스플롯 렌더링 */}
          <Bar
            dataKey="marketRange"
            fill="#3b82f6"
            shape={(props: any) => {
              const { x, y, width, height, payload } = props
              return (
                <CustomBoxPlot
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  data={payload.market}
                />
              )
            }}
          />
          
          {/* 우리 회사(SBL) 중위수 - 강조 표시 */}
          <Line
            type="monotone"
            dataKey="companyMedian"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ r: 6, fill: '#ef4444' }}
            name="우리사 중위수 (SBL)"
          />
          
          {/* 우리 회사 평균 */}
          <Line
            type="monotone"
            dataKey="companyMean"
            stroke="#f97316"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: '#f97316' }}
            name="우리사 평균"
          />
          
          {/* 경쟁사(CA) 중위수 */}
          {showCompetitor && (
            <Line
              type="monotone"
              dataKey="competitorMedian"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 5, fill: '#10b981' }}
              name="경쟁사 중위수 (CA)"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 범례 설명 */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500"></div>
          <span>시장 벤치마크 (IQR)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-gray-400"></div>
          <span>Min-Max 범위</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span className="font-semibold">우리사 (SBL)</span>
        </div>
        {showCompetitor && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>경쟁사 (CA)</span>
          </div>
        )}
      </div>
    </div>
  )
}