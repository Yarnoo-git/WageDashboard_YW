/**
 * 매트릭스 조정 뷰 컴포넌트
 * Band × Level 매트릭스에서 가로축은 평가등급
 */

'use client'

import React, { useState, memo } from 'react'
import { MatrixCell, RateValues } from '@/types/adjustmentMatrix'
import { UI_CONFIG, ADJUSTMENT_CONFIG } from '@/config/constants'

interface MatrixAdjustmentViewProps {
  cell: MatrixCell
  grades: string[]
  onGradeRateChange: (
    grade: string,
    field: keyof RateValues,
    value: number
  ) => void
  isReadOnly?: boolean
  showStatistics?: boolean
}

/**
 * 단일 셀 (Band × Level) 조정 컴포넌트
 * 가로축은 평가등급(ST, AT, OT, BT)
 */
export const MatrixCellAdjustment = memo(function MatrixCellAdjustment({
  cell,
  grades,
  onGradeRateChange,
  isReadOnly = false,
  showStatistics = true
}: MatrixAdjustmentViewProps) {
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null)
  
  // 셀 통계
  const totalEmployees = cell.statistics.employeeCount
  const avgSalary = cell.statistics.averageSalary
  const cellAverage = cell.weightedAverage
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 헤더: Band × Level 정보 */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-gray-900">
              {cell.band} × {cell.level}
            </h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {totalEmployees.toLocaleString()}명
            </span>
          </div>
          
          {showStatistics && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>평균 연봉: {(avgSalary / 10000).toFixed(0)}만원</span>
              <span>가중치: {(cell.weightedAverage.weightInMatrix * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 테이블: 가로축 = 평가등급 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 w-32">
                구분
              </th>
              {/* 평가등급 헤더 (가로축) */}
              {grades.map(grade => {
                const gradeColor = UI_CONFIG.GRADE_COLORS[grade as keyof typeof UI_CONFIG.GRADE_COLORS]
                const gradeCount = cell.statistics.gradeDistribution[grade] || 0
                
                return (
                  <th 
                    key={grade}
                    className={`px-3 py-3 text-center text-xs font-semibold ${
                      gradeColor?.text || 'text-gray-700'
                    } ${
                      gradeColor?.bg || 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{grade}</div>
                      <div className="text-xs font-normal mt-0.5">
                        ({gradeCount}명)
                      </div>
                    </div>
                  </th>
                )
              })}
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 bg-gray-100">
                평균
              </th>
            </tr>
          </thead>
          
          <tbody>
            {/* Base-up 행 */}
            <tr className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-700">
                Base-up (%)
              </td>
              {grades.map(grade => (
                <td key={`base-${grade}`} className="px-3 py-2 text-center">
                  {isReadOnly ? (
                    <span className="text-sm font-medium">
                      {cell.gradeRates[grade]?.baseUp?.toFixed(1) || '0.0'}%
                    </span>
                  ) : (
                    <input
                      type="number"
                      value={cell.gradeRates[grade]?.baseUp || 0}
                      onChange={(e) => onGradeRateChange(
                        grade, 
                        'baseUp', 
                        parseFloat(e.target.value) || 0
                      )}
                      className="w-16 px-2 py-1 text-sm text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step={ADJUSTMENT_CONFIG.RATE_STEP}
                      min={ADJUSTMENT_CONFIG.MIN_RATE}
                      max={ADJUSTMENT_CONFIG.MAX_RATE}
                    />
                  )}
                </td>
              ))}
              <td className="px-3 py-2 text-center bg-gray-50">
                <span className="text-sm font-semibold text-gray-700">
                  {cellAverage.baseUp.toFixed(1)}%
                </span>
              </td>
            </tr>
            
            {/* Merit 행 */}
            <tr className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-700">
                Merit (%)
              </td>
              {grades.map(grade => (
                <td key={`merit-${grade}`} className="px-3 py-2 text-center">
                  {isReadOnly ? (
                    <span className="text-sm font-medium">
                      {cell.gradeRates[grade]?.merit?.toFixed(1) || '0.0'}%
                    </span>
                  ) : (
                    <input
                      type="number"
                      value={cell.gradeRates[grade]?.merit || 0}
                      onChange={(e) => onGradeRateChange(
                        grade, 
                        'merit', 
                        parseFloat(e.target.value) || 0
                      )}
                      className="w-16 px-2 py-1 text-sm text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step={ADJUSTMENT_CONFIG.RATE_STEP}
                      min={ADJUSTMENT_CONFIG.MIN_RATE}
                      max={ADJUSTMENT_CONFIG.MAX_RATE}
                    />
                  )}
                </td>
              ))}
              <td className="px-3 py-2 text-center bg-gray-50">
                <span className="text-sm font-semibold text-gray-700">
                  {cellAverage.merit.toFixed(1)}%
                </span>
              </td>
            </tr>
            
            {/* 추가 인상 행 */}
            <tr className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-700">
                추가 (%/만원)
              </td>
              {grades.map(grade => (
                <td key={`add-${grade}`} className="px-3 py-2 text-center">
                  {isReadOnly ? (
                    <span className="text-sm font-medium">
                      {cell.gradeRates[grade]?.additional?.toFixed(1) || '0.0'}
                    </span>
                  ) : (
                    <input
                      type="number"
                      value={cell.gradeRates[grade]?.additional || 0}
                      onChange={(e) => onGradeRateChange(
                        grade, 
                        'additional', 
                        parseFloat(e.target.value) || 0
                      )}
                      className="w-16 px-2 py-1 text-sm text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step={ADJUSTMENT_CONFIG.RATE_STEP}
                      min={0}
                      max={ADJUSTMENT_CONFIG.MAX_RATE}
                    />
                  )}
                </td>
              ))}
              <td className="px-3 py-2 text-center bg-gray-50">
                <span className="text-sm font-semibold text-gray-700">
                  {cellAverage.additional.toFixed(1)}
                </span>
              </td>
            </tr>
            
            {/* 총계 행 */}
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-3 text-sm text-gray-900">
                총 인상률
              </td>
              {grades.map(grade => {
                const rates = cell.gradeRates[grade] || { baseUp: 0, merit: 0, additional: 0 }
                const total = rates.baseUp + rates.merit
                
                return (
                  <td key={`total-${grade}`} className="px-3 py-2 text-center">
                    <span className={`text-sm font-bold ${
                      total > 10 ? 'text-red-600' : 
                      total > 5 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {total.toFixed(1)}%
                    </span>
                  </td>
                )
              })}
              <td className="px-3 py-2 text-center bg-gray-100">
                <span className="text-sm font-bold text-blue-600">
                  {cellAverage.total.toFixed(1)}%
                </span>
              </td>
            </tr>
            
            {/* Pay Zone 세부 설정 (선택적) */}
            {!isReadOnly && (
              <tr className="border-t">
                <td colSpan={grades.length + 2} className="px-4 py-2">
                  <button
                    onClick={() => setExpandedGrade(expandedGrade ? null : (grades[0] ?? null))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {expandedGrade ? '▲ Pay Zone 세부 설정 닫기' : '▼ Pay Zone 세부 설정 열기'}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pay Zone 세부 설정 패널 (확장 시) */}
      {expandedGrade && !isReadOnly && (
        <PayZoneDetailPanel
          cell={cell}
          grade={expandedGrade}
          onClose={() => setExpandedGrade(null)}
        />
      )}
    </div>
  )
})

/**
 * Pay Zone 세부 설정 패널
 */
function PayZoneDetailPanel({
  cell,
  grade,
  onClose
}: {
  cell: MatrixCell
  grade: string
  onClose: () => void
}) {
  const payZoneDistribution = cell.statistics.payZoneDistribution || {}
  const zones = Object.keys(payZoneDistribution)
    .map(Number)
    .sort((a, b) => a - b)
  
  if (zones.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-gray-500 text-center">
        Pay Zone 분포 데이터가 없습니다.
      </div>
    )
  }
  
  return (
    <div className="px-4 py-3 bg-gray-50 border-t">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold text-gray-700">
          {cell.band} × {cell.level} × {grade} - Pay Zone별 세부 설정
        </h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      
      <div className="grid grid-cols-6 gap-2">
        {zones.map(zone => (
          <div key={zone} className="text-center">
            <div className="text-xs text-gray-600 mb-1">
              Zone {zone} ({payZoneDistribution[zone]}명)
            </div>
            <input
              type="number"
              placeholder="Base-up"
              className="w-full px-2 py-1 text-xs border rounded mb-1"
              step="0.1"
            />
            <input
              type="number"
              placeholder="Merit"
              className="w-full px-2 py-1 text-xs border rounded"
              step="0.1"
            />
          </div>
        ))}
      </div>
    </div>
  )
}