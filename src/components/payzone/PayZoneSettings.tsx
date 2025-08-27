/**
 * Pay Zone 설정 컴포넌트
 * Level별 Pay Zone 구간을 min/max로 설정
 */

'use client'

import React, { useState, useEffect } from 'react'
import { PayZoneConfiguration, LevelPayZoneConfig } from '@/types/payZone'
import { payZoneService } from '@/services/payZoneService'
import { Employee } from '@/types/employee'
import { UNITS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/config/constants'

interface PayZoneSettingsProps {
  employees: Employee[]
  onConfigChange?: (config: PayZoneConfiguration) => void
}

export function PayZoneSettings({ 
  employees, 
  onConfigChange 
}: PayZoneSettingsProps) {
  const [config, setConfig] = useState<PayZoneConfiguration>(
    payZoneService.getConfig()
  )
  const [mode, setMode] = useState<'manual' | 'range'>(config.mode)
  const [isEditing, setIsEditing] = useState(false)
  const [previewResult, setPreviewResult] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  // Level별 설정 UI 상태
  const [editingLevel, setEditingLevel] = useState<string | null>(null)
  
  // 미리보기 계산
  useEffect(() => {
    if (mode === 'range' && employees.length > 0) {
      const result = payZoneService.reassignAll(employees, config)
      setPreviewResult(result)
    }
  }, [config, employees, mode])
  
  // 모드 전환
  const handleModeChange = (newMode: 'manual' | 'range') => {
    setMode(newMode)
    const newConfig = { ...config, mode: newMode }
    setConfig(newConfig)
  }
  
  // Level 설정 업데이트
  const handleLevelConfigUpdate = (
    level: string, 
    zoneId: number, 
    field: 'minSalary' | 'maxSalary' | 'isActive', 
    value: any
  ) => {
    const newConfig = { ...config }
    const levelConfig = newConfig.levelConfigs.find(lc => lc.level === level)
    
    if (levelConfig) {
      const range = levelConfig.ranges.find(r => r.zoneId === zoneId)
      if (range) {
        if (field === 'isActive') {
          range.isActive = value as boolean
        } else {
          range[field] = value as number
        }
      }
      
      setConfig(newConfig)
    }
  }
  
  // 저장
  const handleSave = () => {
    try {
      payZoneService.saveConfig(config)
      if (onConfigChange) {
        onConfigChange(config)
      }
      setIsEditing(false)
      alert(SUCCESS_MESSAGES.SETTINGS_UPDATED)
    } catch (error) {
      alert(ERROR_MESSAGES.SAVE_ERROR)
    }
  }
  
  // 초기화
  const handleReset = () => {
    if (confirm('기본 설정으로 초기화하시겠습니까?')) {
      payZoneService.resetToDefault()
      setConfig(payZoneService.getConfig())
      alert(SUCCESS_MESSAGES.RESET)
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Pay Zone 구간 설정</h2>
            <p className="text-blue-100 text-sm mt-1">
              Level별 연봉 구간을 설정하여 Pay Zone을 자동 할당합니다
            </p>
          </div>
          
          {/* 모드 선택 */}
          <div className="flex items-center gap-2">
            <span className="text-sm">모드:</span>
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value as 'manual' | 'range')}
              className="px-3 py-1 text-gray-800 rounded"
            >
              <option value="manual">수동 (엑셀값 사용)</option>
              <option value="range">구간 설정</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 컨텐츠 */}
      <div className="p-6">
        {mode === 'manual' ? (
          // 수동 모드
          <div className="text-center py-8 text-gray-600">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">엑셀 파일의 Pay Zone 값을 사용합니다</p>
            <p className="text-sm mt-2">각 직원의 기존 Pay Zone 값이 유지됩니다</p>
          </div>
        ) : (
          // 구간 설정 모드
          <div>
            {/* Level별 설정 */}
            <div className="space-y-4">
              {config.levelConfigs.map(levelConfig => (
                <LevelPayZoneSetting
                  key={levelConfig.level}
                  levelConfig={levelConfig}
                  isExpanded={editingLevel === levelConfig.level}
                  onExpand={() => setEditingLevel(
                    editingLevel === levelConfig.level ? null : levelConfig.level
                  )}
                  onUpdate={(zoneId, field, value) => 
                    handleLevelConfigUpdate(levelConfig.level, zoneId, field, value)
                  }
                  employeeCount={employees.filter(e => e.level === levelConfig.level).length}
                />
              ))}
            </div>
            
            {/* 미리보기 */}
            {previewResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">
                    반영 예상 결과
                  </h3>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {showPreview ? '상세 닫기' : '상세 보기'}
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {previewResult.totalEmployees.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">총 인원</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {previewResult.reassigned.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">재할당</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {previewResult.unchanged.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">유지</div>
                  </div>
                </div>
                
                {showPreview && previewResult.details.length > 0 && (
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">이름</th>
                          <th className="px-2 py-1 text-left">레벨</th>
                          <th className="px-2 py-1 text-right">연봉</th>
                          <th className="px-2 py-1 text-center">기존</th>
                          <th className="px-2 py-1 text-center">신규</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {previewResult.details.slice(0, 50).map((detail: any) => (
                          <tr key={detail.employeeId} className="hover:bg-gray-50">
                            <td className="px-2 py-1">{detail.employeeName}</td>
                            <td className="px-2 py-1">{detail.level}</td>
                            <td className="px-2 py-1 text-right">
                              {(detail.currentSalary / UNITS.MAN_WON).toFixed(0)}만원
                            </td>
                            <td className="px-2 py-1 text-center">
                              Zone {detail.previousZone}
                            </td>
                            <td className="px-2 py-1 text-center font-semibold text-blue-600">
                              Zone {detail.newZone}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewResult.details.length > 50 && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        ... 외 {previewResult.details.length - 50}건
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 하단 버튼 */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          기본값 복원
        </button>
        
        <div className="flex gap-2">
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              취소
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Level별 Pay Zone 설정 컴포넌트
 */
function LevelPayZoneSetting({
  levelConfig,
  isExpanded,
  onExpand,
  onUpdate,
  employeeCount
}: {
  levelConfig: LevelPayZoneConfig
  isExpanded: boolean
  onExpand: () => void
  onUpdate: (
    zoneId: number, 
    field: 'minSalary' | 'maxSalary' | 'isActive', 
    value: any
  ) => void
  employeeCount: number
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
        onClick={onExpand}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">{levelConfig.level}</h3>
          <span className="text-sm text-gray-500">({employeeCount}명)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            활성 Zone: {levelConfig.ranges.filter(r => r.isActive).length}개
          </span>
          <span className={`transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}>
            ▼
          </span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left text-sm font-semibold text-gray-700">
                  Zone
                </th>
                <th className="pb-2 text-left text-sm font-semibold text-gray-700">
                  최소 연봉 (원)
                </th>
                <th className="pb-2 text-left text-sm font-semibold text-gray-700">
                  최대 연봉 (원)
                </th>
                <th className="pb-2 text-center text-sm font-semibold text-gray-700">
                  사용
                </th>
              </tr>
            </thead>
            <tbody>
              {levelConfig.ranges.map(range => (
                <tr key={range.zoneId} className="border-b">
                  <td className="py-2 font-medium">
                    Zone {range.zoneId}
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={range.minSalary}
                      onChange={(e) => onUpdate(
                        range.zoneId, 
                        'minSalary', 
                        parseInt(e.target.value) || 0
                      )}
                      disabled={!range.isActive}
                      className={`w-32 px-2 py-1 border rounded ${
                        range.isActive ? '' : 'bg-gray-100 text-gray-400'
                      }`}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={range.maxSalary}
                      onChange={(e) => onUpdate(
                        range.zoneId, 
                        'maxSalary', 
                        parseInt(e.target.value) || 0
                      )}
                      disabled={!range.isActive}
                      className={`w-32 px-2 py-1 border rounded ${
                        range.isActive ? '' : 'bg-gray-100 text-gray-400'
                      }`}
                    />
                  </td>
                  <td className="py-2 text-center">
                    <input
                      type="checkbox"
                      checked={range.isActive}
                      onChange={(e) => onUpdate(
                        range.zoneId, 
                        'isActive', 
                        e.target.checked
                      )}
                      className="w-4 h-4"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}