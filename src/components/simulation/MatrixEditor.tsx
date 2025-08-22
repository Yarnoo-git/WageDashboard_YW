'use client'

import React, { useState, useCallback } from 'react'

interface MatrixEditorProps {
  levels: string[]
  bands: string[]
  rates: { [band: string]: { [level: string]: { baseUp: number; merit: number } } }
  onCellChange: (band: string, level: string, type: 'baseUp' | 'merit', value: number) => void
  onBulkChange: (type: 'row' | 'column' | 'all', target: string | null, rateType: 'baseUp' | 'merit', value: number) => void
  employeeCounts?: { [band: string]: { [level: string]: number } }
  showMerit?: boolean
}

export function MatrixEditor({
  levels,
  bands,
  rates,
  onCellChange,
  onBulkChange,
  employeeCounts,
  showMerit = false
}: MatrixEditorProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState<string>('')
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [activeRateType, setActiveRateType] = useState<'baseUp' | 'merit'>('baseUp')
  
  const handleCellClick = (band: string, level: string, type: 'baseUp' | 'merit') => {
    const cellKey = `${band}-${level}-${type}`
    setEditingCell(cellKey)
    setTempValue((rates[band]?.[level]?.[type] || 0).toString())
  }
  
  const handleCellBlur = (band: string, level: string, type: 'baseUp' | 'merit') => {
    const value = parseFloat(tempValue) || 0
    onCellChange(band, level, type, value)
    setEditingCell(null)
    setTempValue('')
  }
  
  const handleKeyDown = (e: React.KeyboardEvent, band: string, level: string, type: 'baseUp' | 'merit') => {
    if (e.key === 'Enter') {
      handleCellBlur(band, level, type)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      setTempValue('')
    }
  }
  
  const getCellValue = (band: string, level: string, type: 'baseUp' | 'merit') => {
    return rates[band]?.[level]?.[type] || 0
  }
  
  const getTotalRate = (band: string, level: string) => {
    const baseUp = getCellValue(band, level, 'baseUp')
    const merit = getCellValue(band, level, 'merit')
    return baseUp + merit
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 헤더 및 컨트롤 */}
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-medium text-gray-900">매트릭스 편집기</h3>
          {showMerit && (
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setActiveRateType('baseUp')}
                className={`px-3 py-1 rounded ${
                  activeRateType === 'baseUp' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Base-up
              </button>
              <button
                onClick={() => setActiveRateType('merit')}
                className={`px-3 py-1 rounded ${
                  activeRateType === 'merit' 
                    ? 'bg-green-100 text-green-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                성과인상률
              </button>
            </div>
          )}
        </div>
        
        {/* 일괄 적용 도구 */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            placeholder="일괄 적용"
            className="w-24 px-2 py-1 text-sm border rounded"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = parseFloat((e.target as HTMLInputElement).value) || 0
                onBulkChange('all', null, activeRateType, value)
                ;(e.target as HTMLInputElement).value = ''
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder="일괄 적용"]') as HTMLInputElement
              if (input) {
                const value = parseFloat(input.value) || 0
                onBulkChange('all', null, activeRateType, value)
                input.value = ''
              }
            }}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            전체 적용
          </button>
        </div>
      </div>
      
      {/* 매트릭스 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="sticky left-0 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-700">
                직군 / 직급
              </th>
              {levels.map(level => (
                <th key={level} className="px-2 py-2 text-center">
                  <div className="text-xs font-medium text-gray-700">{level}</div>
                  <button
                    onClick={() => onBulkChange('column', level, activeRateType, 0)}
                    className="mt-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    일괄
                  </button>
                </th>
              ))}
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">
                평균
              </th>
            </tr>
          </thead>
          <tbody>
            {bands.map((band, bandIdx) => {
              const bandAvg = levels.reduce((sum, level) => sum + getTotalRate(band, level), 0) / levels.length
              
              return (
                <tr key={band} className={bandIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="sticky left-0 px-3 py-2 font-medium text-sm text-gray-900 bg-inherit">
                    <div className="flex items-center justify-between">
                      <span>{band}</span>
                      <button
                        onClick={() => onBulkChange('row', band, activeRateType, 0)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        일괄
                      </button>
                    </div>
                  </td>
                  {levels.map(level => {
                    const cellKey = `${band}-${level}-${activeRateType}`
                    const isEditing = editingCell === cellKey
                    const value = getCellValue(band, level, activeRateType)
                    const total = getTotalRate(band, level)
                    const empCount = employeeCounts?.[band]?.[level] || 0
                    
                    return (
                      <td key={level} className="px-1 py-1 text-center">
                        <div className="relative group">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onBlur={() => handleCellBlur(band, level, activeRateType)}
                              onKeyDown={(e) => handleKeyDown(e, band, level, activeRateType)}
                              className="w-16 px-1 py-0.5 text-sm text-center border border-blue-500 rounded"
                              autoFocus
                            />
                          ) : (
                            <div
                              onClick={() => handleCellClick(band, level, activeRateType)}
                              className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5"
                            >
                              <div className="font-medium text-sm">
                                {value.toFixed(1)}%
                              </div>
                              {showMerit && (
                                <div className="text-xs text-gray-500">
                                  총 {total.toFixed(1)}%
                                </div>
                              )}
                              {empCount > 0 && (
                                <div className="text-xs text-gray-400">
                                  {empCount}명
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* 호버 시 상세 정보 */}
                          {!isEditing && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                              <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                {band} {level}
                                {empCount > 0 && ` (${empCount}명)`}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 text-center">
                    <div className="font-medium text-sm text-gray-700">
                      {bandAvg.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              )
            })}
            
            {/* 평균 행 */}
            <tr className="bg-gray-100 border-t-2 border-gray-300">
              <td className="sticky left-0 bg-gray-100 px-3 py-2 font-medium text-sm text-gray-900">
                평균
              </td>
              {levels.map(level => {
                const levelAvg = bands.reduce((sum, band) => sum + getTotalRate(band, level), 0) / bands.length
                
                return (
                  <td key={level} className="px-2 py-2 text-center">
                    <div className="font-medium text-sm text-gray-700">
                      {levelAvg.toFixed(1)}%
                    </div>
                  </td>
                )
              })}
              <td className="px-3 py-2 text-center">
                <div className="font-bold text-sm text-gray-900">
                  {(
                    bands.reduce((sum, band) => 
                      sum + levels.reduce((levelSum, level) => 
                        levelSum + getTotalRate(band, level), 0
                      ), 0
                    ) / (bands.length * levels.length)
                  ).toFixed(1)}%
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* 하단 도구 */}
      <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Base-up</span>
          </div>
          {showMerit && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 rounded"></div>
              <span>성과인상률</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span>클릭하여 편집</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
            초기화
          </button>
          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            적용
          </button>
        </div>
      </div>
    </div>
  )
}