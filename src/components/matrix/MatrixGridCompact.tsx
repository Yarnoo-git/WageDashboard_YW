/**
 * 컴팩트 매트릭스 그리드 컴포넌트
 * Band × Level × Grade (ST/AT/OT/BT) 구조를 컴팩트하게 표시
 */

'use client'

import React, { useState, useCallback } from 'react'
import { AdjustmentMatrix, RateValues } from '@/types/adjustmentMatrix'
import { UI_CONFIG } from '@/config/constants'
import { formatPercentage } from '@/lib/utils'

interface MatrixGridCompactProps {
  matrix: AdjustmentMatrix
  onCellGradeRateChange: (
    band: string,
    level: string,
    grade: string,
    field: 'baseUp' | 'merit' | 'additional',
    value: number
  ) => void
  isReadOnly?: boolean
}

interface CellEditState {
  band: string
  level: string
  grade: string
  field: 'baseUp' | 'merit' | 'additional'
}

export function MatrixGridCompact({
  matrix,
  onCellGradeRateChange,
  isReadOnly = false
}: MatrixGridCompactProps) {
  const [editingCell, setEditingCell] = useState<CellEditState | null>(null)
  const [hoverCell, setHoverCell] = useState<{ band: string; level: string; grade: string } | null>(null)
  const [viewMode, setViewMode] = useState<'compact' | 'standard' | 'detailed'>('compact')

  // 평가등급은 ST/AT/OT/BT 순서로 고정
  const grades = ['ST', 'AT', 'OT', 'BT']

  // Pay Zone 분포 포맷
  const formatPayZoneDistribution = (distribution: { [key: number]: number } | undefined) => {
    if (!distribution) return ''
    const zones = Object.entries(distribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([zone, count]) => `${zone}(${count})`)
      .join(' ')
    return zones ? `Zone: ${zones}` : ''
  }

  // 인라인 편집 핸들러
  const handleInlineEdit = useCallback((
    band: string,
    level: string,
    grade: string,
    field: 'baseUp' | 'merit' | 'additional',
    value: string
  ) => {
    const numValue = parseFloat(value) || 0
    onCellGradeRateChange(band, level, grade, field, numValue)
  }, [onCellGradeRateChange])

  // 컴팩트 셀 렌더링
  const renderCompactCell = (
    band: string,
    level: string,
    grade: string,
    rates: RateValues,
    employeeCount: number
  ) => {
    const isHover = hoverCell?.band === band && hoverCell?.level === level && hoverCell?.grade === grade
    const isEditing = editingCell?.band === band && editingCell?.level === level && editingCell?.grade === grade
    const total = rates.baseUp + rates.merit + rates.additional
    const gradeColor = UI_CONFIG.GRADE_COLORS[grade as keyof typeof UI_CONFIG.GRADE_COLORS]

    if (viewMode === 'detailed' || isEditing) {
      // 상세 편집 모드
      return (
        <div className="p-2 space-y-1">
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              value={rates.baseUp}
              onChange={(e) => handleInlineEdit(band, level, grade, 'baseUp', e.target.value)}
              className="w-14 px-1 py-0.5 text-xs border rounded text-blue-600 font-medium"
              disabled={isReadOnly}
            />
            <span className="text-xs text-gray-400">+</span>
            <input
              type="number"
              step="0.1"
              value={rates.merit}
              onChange={(e) => handleInlineEdit(band, level, grade, 'merit', e.target.value)}
              className="w-14 px-1 py-0.5 text-xs border rounded text-green-600 font-medium"
              disabled={isReadOnly}
            />
            <span className="text-xs text-gray-400">+</span>
            <input
              type="number"
              step="0.1"
              value={rates.additional}
              onChange={(e) => handleInlineEdit(band, level, grade, 'additional', e.target.value)}
              className="w-14 px-1 py-0.5 text-xs border rounded text-orange-600 font-medium"
              disabled={isReadOnly}
            />
          </div>
          <div className="text-xs font-bold text-gray-900 text-center">
            = {formatPercentage(total)}
          </div>
          <div className="text-xs text-gray-500 text-center">[{employeeCount}명]</div>
        </div>
      )
    }

    if (isHover && !isReadOnly) {
      // 호버시 간단 편집 UI
      return (
        <div 
          className={`p-2 cursor-pointer ${gradeColor.bg} rounded transition-all`}
          onClick={() => setEditingCell({ band, level, grade, field: 'baseUp' })}
        >
          <div className="text-xs space-x-1">
            <span className="text-blue-600 font-medium">{rates.baseUp}</span>
            <span className="text-gray-400">+</span>
            <span className="text-green-600 font-medium">{rates.merit}</span>
            <span className="text-gray-400">+</span>
            <span className="text-orange-600 font-medium">{rates.additional}</span>
          </div>
          <div className="text-sm font-bold text-gray-900 mt-1">
            = {formatPercentage(total)}
          </div>
          <div className="text-xs text-gray-500 mt-1">[{employeeCount}명]</div>
        </div>
      )
    }

    // 기본 컴팩트 표시
    return (
      <div 
        className="p-2 text-center hover:bg-gray-50 transition-colors cursor-pointer"
        onMouseEnter={() => setHoverCell({ band, level, grade })}
        onMouseLeave={() => setHoverCell(null)}
        onClick={() => !isReadOnly && setEditingCell({ band, level, grade, field: 'baseUp' })}
      >
        <div className="text-xs text-gray-600">
          <span className="text-blue-500">{rates.baseUp}</span>+
          <span className="text-green-500">{rates.merit}</span>+
          <span className="text-orange-500">{rates.additional}</span>
        </div>
        <div className="text-sm font-bold text-gray-900">
          {formatPercentage(total)}
        </div>
        <div className="text-xs text-gray-500">[{employeeCount}]</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Band × Level × Grade 매트릭스
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('compact')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === 'compact' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Compact
          </button>
          <button
            onClick={() => setViewMode('standard')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === 'standard' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === 'detailed' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Detailed
          </button>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Base-up</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Merit</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span>Additional</span>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                Band × Level
              </th>
              {grades.map(grade => {
                const gradeColor = UI_CONFIG.GRADE_COLORS[grade as keyof typeof UI_CONFIG.GRADE_COLORS]
                return (
                  <th 
                    key={grade}
                    className={`border border-gray-300 px-3 py-2 text-sm font-semibold ${gradeColor.bg} ${gradeColor.text}`}
                  >
                    {grade}
                  </th>
                )
              })}
              <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                가중평균
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.bands.map(band => (
              matrix.levels.map(level => {
                const cell = matrix.cellMap[band]?.[level]
                if (!cell) return null

                const weightedAvg = cell.weightedAverage
                const totalEmployees = cell.statistics.employeeCount
                const payZoneDistribution = formatPayZoneDistribution(cell.statistics.payZoneDistribution)

                return (
                  <tr key={`${band}-${level}`}>
                    <td className="border border-gray-300 bg-gray-50 px-3 py-2">
                      <div className="font-semibold text-sm text-gray-700">{band} × {level}</div>
                      <div className="text-xs text-gray-600 mt-1">({totalEmployees}명)</div>
                      {payZoneDistribution && (
                        <div className="text-xs text-gray-500 mt-1">{payZoneDistribution}</div>
                      )}
                    </td>
                    {grades.map(grade => {
                      const rates = cell.gradeRates[grade] || { baseUp: 0, merit: 0, additional: 0 }
                      const gradeCount = cell.statistics.gradeDistribution[grade] || 0
                      
                      return (
                        <td key={grade} className="border border-gray-300 p-0">
                          {renderCompactCell(band, level, grade, rates, gradeCount)}
                        </td>
                      )
                    })}
                    <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-center">
                      <div className="text-sm font-bold text-gray-900">
                        {formatPercentage(weightedAvg.total)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="text-blue-500">{weightedAvg.baseUp.toFixed(1)}</span>+
                        <span className="text-green-500">{weightedAvg.merit.toFixed(1)}</span>+
                        <span className="text-orange-500">{weightedAvg.additional.toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                )
              })
            ))}
          </tbody>
        </table>
      </div>

      {/* 하단 안내 */}
      {!isReadOnly && (
        <div className="mt-4 text-xs text-gray-500">
          <p>• 셀을 클릭하여 편집할 수 있습니다</p>
          <p>• 숫자 형식: Base-up + Merit + Additional = 총 인상률</p>
          <p>• Pay Zone은 Level별로 자동 적용됩니다</p>
        </div>
      )}
    </div>
  )
}