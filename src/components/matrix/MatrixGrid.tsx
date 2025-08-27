/**
 * 매트릭스 그리드 컴포넌트
 * 전체 Band × Level 매트릭스를 그리드 형태로 표시
 */

'use client'

import React, { useState, useMemo } from 'react'
import { AdjustmentMatrix } from '@/types/adjustmentMatrix'
import { MatrixCellAdjustment } from './MatrixAdjustmentView'
import { UI_CONFIG } from '@/config/constants'

interface MatrixGridProps {
  matrix: AdjustmentMatrix
  onCellGradeRateChange: (
    band: string,
    level: string,
    grade: string,
    field: 'baseUp' | 'merit' | 'additional',
    value: number
  ) => void
  selectedCell?: { band: string; level: string } | null
  onCellSelect?: (band: string, level: string) => void
  isReadOnly?: boolean
  showCompactView?: boolean
}

/**
 * 매트릭스 그리드 메인 컴포넌트
 */
export function MatrixGrid({
  matrix,
  onCellGradeRateChange,
  selectedCell,
  onCellSelect,
  isReadOnly = false,
  showCompactView = false
}: MatrixGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [expandedCell, setExpandedCell] = useState<{ band: string; level: string } | null>(null)
  
  // 선택된 셀 또는 확장된 셀
  const activeCell = expandedCell || selectedCell
  
  // 그리드 뷰
  if (viewMode === 'grid' && !showCompactView) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Band × Level 매트릭스 조정
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              그리드 뷰
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              리스트 뷰
            </button>
          </div>
        </div>
        
        {/* 그리드 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
                  Band ↓ / Level →
                </th>
                {matrix.levels.map(level => (
                  <th 
                    key={level}
                    className="border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    {level}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.bands.map(band => (
                <tr key={band}>
                  <td className="border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
                    {band}
                  </td>
                  {matrix.levels.map(level => {
                    const cell = matrix.cellMap[band][level]
                    const isActive = activeCell?.band === band && activeCell?.level === level
                    const avgRate = cell.weightedAverage.total
                    const empCount = cell.statistics.employeeCount
                    
                    return (
                      <td 
                        key={`${band}-${level}`}
                        className={`border border-gray-300 p-2 cursor-pointer transition-all ${
                          isActive 
                            ? 'bg-blue-50 ring-2 ring-blue-500' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          if (onCellSelect) {
                            onCellSelect(band, level)
                          }
                          setExpandedCell({ band, level })
                        }}
                      >
                        <CompactCellView
                          cell={cell}
                          avgRate={avgRate}
                          empCount={empCount}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 선택된 셀 상세 뷰 */}
        {activeCell && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                {activeCell.band} × {activeCell.level} 상세 조정
              </h3>
              <button
                onClick={() => setExpandedCell(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                닫기
              </button>
            </div>
            <MatrixCellAdjustment
              cell={matrix.cellMap[activeCell.band][activeCell.level]}
              grades={matrix.grades}
              onGradeRateChange={(grade, field, value) => 
                onCellGradeRateChange(activeCell.band, activeCell.level, grade, field, value)
              }
              isReadOnly={isReadOnly}
            />
          </div>
        )}
      </div>
    )
  }
  
  // 리스트 뷰
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">
            Band × Level 매트릭스 조정 (리스트 뷰)
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              그리드 뷰
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              리스트 뷰
            </button>
          </div>
        </div>
      </div>
      
      {/* 리스트 */}
      {matrix.bands.map(band => (
        <div key={band} className="bg-white rounded-lg shadow-sm">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="text-base font-semibold text-gray-900">{band}</h3>
          </div>
          <div className="divide-y">
            {matrix.levels.map(level => {
              const cell = matrix.cellMap[band][level]
              const isExpanded = expandedCell?.band === band && expandedCell?.level === level
              
              return (
                <div key={`${band}-${level}`}>
                  <div 
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedCell(
                      isExpanded ? null : { band, level }
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-900">{level}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({cell.statistics.employeeCount}명)
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          평균: {cell.weightedAverage.total.toFixed(1)}%
                        </span>
                        <span className={`text-xs ${
                          isExpanded ? 'rotate-180' : ''
                        } transition-transform`}>
                          ▼
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 py-3 bg-gray-50 border-t">
                      <MatrixCellAdjustment
                        cell={cell}
                        grades={matrix.grades}
                        onGradeRateChange={(grade, field, value) => 
                          onCellGradeRateChange(band, level, grade, field, value)
                        }
                        isReadOnly={isReadOnly}
                        showStatistics={false}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 컴팩트 셀 뷰 (그리드용)
 */
function CompactCellView({
  cell,
  avgRate,
  empCount
}: {
  cell: any
  avgRate: number
  empCount: number
}) {
  // 평가등급별 간단 표시
  const gradeRates = Object.entries(cell.gradeRates)
    .slice(0, 2) // 상위 2개 등급만
    .map(([grade, rates]: [string, any]) => (
      <div key={grade} className="text-xs">
        <span className="font-medium">{grade}:</span>
        <span className="ml-1">
          {(rates.baseUp + rates.merit).toFixed(1)}%
        </span>
      </div>
    ))
  
  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${
        avgRate > 5 ? 'text-red-600' :
        avgRate > 3 ? 'text-yellow-600' :
        'text-green-600'
      }`}>
        {avgRate.toFixed(1)}%
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {empCount}명
      </div>
      <div className="mt-2 space-y-0.5">
        {gradeRates}
      </div>
    </div>
  )
}