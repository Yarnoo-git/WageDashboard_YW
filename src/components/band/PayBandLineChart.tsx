'use client'

import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { formatKoreanCurrency } from '@/lib/utils'

interface ChartDataPoint {
  level: string
  sblMedian: number
  sblMedianAdjusted?: number  // 조정 후 값
  caMedian: number
}

interface PayBandLineChartProps {
  data: ChartDataPoint[]
  bandName: string
}

export function PayBandLineChart({ data }: PayBandLineChartProps) {
  // Y축 범위 계산 - 고정된 범위로 설정
  const yAxisDomain = useMemo(() => {
    // 초기 데이터의 모든 값을 기준으로 계산
    const allValues = data.flatMap(d => [
      d.sblMedian,
      d.caMedian,
      // 조정 후 값이 있다면 최대 20% 인상까지 고려
      d.sblMedian * 1.2
    ])
    const maxValue = Math.max(...allValues)
    // 최소값은 0, 최대값은 가장 큰 값의 1.3배로 여유 있게 설정
    return [0, Math.ceil(maxValue * 1.3 / 10000000) * 10000000]
  }, [data[0]?.sblMedian]) // 초기 데이터 기준으로만 계산

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <div className="space-y-1">
            {payload.find((p: any) => p.dataKey === 'sblMedian') && (
              <p className="text-xs">
                <span className="text-red-300 font-semibold">SBL (현재):</span>{' '}
                {formatKoreanCurrency(payload.find((p: any) => p.dataKey === 'sblMedian')?.value || 0, '만원')}
              </p>
            )}
            {payload.find((p: any) => p.dataKey === 'sblMedianAdjusted') && (
              <p className="text-xs">
                <span className="text-red-600 font-semibold">SBL (조정 후):</span>{' '}
                {formatKoreanCurrency(payload.find((p: any) => p.dataKey === 'sblMedianAdjusted')?.value || 0, '만원')}
              </p>
            )}
            <p className="text-xs">
              <span className="text-blue-600 font-semibold">C사:</span>{' '}
              {formatKoreanCurrency(payload.find((p: any) => p.dataKey === 'caMedian')?.value || 0, '만원')}
            </p>
            {payload.find((p: any) => p.dataKey === 'sblMedianAdjusted') && (
              <p className="text-xs font-semibold">
                보상 경쟁력 (조정 후): {(
                  Math.round((payload.find((p: any) => p.dataKey === 'sblMedianAdjusted')?.value / 
                   payload.find((p: any) => p.dataKey === 'caMedian')?.value) * 100 * 10) / 10
                ).toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // 화면 크기에 따른 차트 높이
  const chartHeight = typeof window !== 'undefined' && window.innerWidth < 768 ? 250 : 400
  
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={chartHeight} minHeight={200}>
        <LineChart
          data={data}
          margin={{ top: 2, right: 5, left: 5, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          <XAxis 
            dataKey="level" 
            tick={{ fontSize: 10 }}
            axisLine={{ stroke: '#9ca3af' }}
            padding={{ left: 20, right: 20 }}
          />
          
          <YAxis 
            domain={yAxisDomain}
            tickFormatter={(value) => `${(value / 10000).toFixed(0)}`}
            tick={{ fontSize: 9 }}
            axisLine={{ stroke: '#9ca3af' }}
            width={35}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            verticalAlign="top" 
            height={20}
            iconType="line"
            wrapperStyle={{ fontSize: '12px', paddingTop: '0px' }}
          />
          
          {/* SBL 현재 중위수 (점선) */}
          <Line
            type="monotone"
            dataKey="sblMedian"
            stroke="#6b7280"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: '#6b7280' }}
            activeDot={{ r: 6 }}
            name="SBL (현재)"
          />
          
          {/* SBL 조정 후 중위수 (실선) */}
          {data[0]?.sblMedianAdjusted && (
            <Line
              type="monotone"
              dataKey="sblMedianAdjusted"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 6, fill: '#2563eb' }}
              activeDot={{ r: 8 }}
              name="SBL (조정 후)"
            />
          )}
          
          {/* C사 중위수 */}
          <Line
            type="monotone"
            dataKey="caMedian"
            stroke="#059669"
            strokeWidth={2.5}
            dot={{ r: 5, fill: '#059669' }}
            activeDot={{ r: 7 }}
            name="C사"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}