'use client'

import { useState } from 'react'
import { Scenario } from '@/types/scenario'

interface ScenarioManagerProps {
  scenarios: Scenario[]
  activeScenarioId: string | null
  onSave: (name: string) => void
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  isNavigation?: boolean // 네비게이션 바에서 사용하는지 여부
}

export function ScenarioManager({
  scenarios,
  activeScenarioId,
  onSave,
  onLoad,
  onDelete,
  isNavigation = false
}: ScenarioManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newScenarioName, setNewScenarioName] = useState('')
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(activeScenarioId)

  const handleSave = () => {
    if (newScenarioName.trim()) {
      onSave(newScenarioName.trim())
      setNewScenarioName('')
    }
  }

  const handleApply = () => {
    if (selectedScenarioId) {
      onLoad(selectedScenarioId)
      setSelectedScenarioId(selectedScenarioId)
      setIsOpen(false) // 팝업 닫기
      // 적용 완료 알림
      setTimeout(() => {
        alert('시나리오가 적용되었습니다.')
      }, 100)
    }
  }

  const buttonClass = isNavigation 
    ? "h-9 px-4 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    : "h-10 px-4 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
      >
        시나리오{scenarios.length > 0 && ` (${scenarios.length})`}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* 헤더 */}
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">시나리오 관리</h3>
              <p className="text-sm text-gray-600 mt-1">현재 설정을 저장하고 불러올 수 있습니다</p>
            </div>

            {/* 저장 영역 */}
            <div className="p-4 border-b">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="새 시나리오 이름"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSave}
                  disabled={!newScenarioName.trim()}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  저장
                </button>
              </div>
            </div>

            {/* 적용 버튼 영역 */}
            {selectedScenarioId && selectedScenarioId !== activeScenarioId && (
              <div className="p-4 bg-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">
                      선택된 시나리오: {scenarios.find(s => s.id === selectedScenarioId)?.name}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      적용 버튼을 클릭하여 이 시나리오를 로드하세요
                    </p>
                  </div>
                  <button
                    onClick={handleApply}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                  >
                    적용
                  </button>
                </div>
              </div>
            )}
            
            {/* 시나리오 목록 */}
            <div className="max-h-96 overflow-y-auto">
              {scenarios.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">저장된 시나리오가 없습니다</p>
                </div>
              ) : (
                <div className="p-2">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className={`p-3 rounded-lg mb-2 border transition-all cursor-pointer ${
                        selectedScenarioId === scenario.id
                          ? 'bg-blue-50 border-blue-300'
                          : activeScenarioId === scenario.id
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedScenarioId(scenario.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{scenario.name}</h4>
                            {selectedScenarioId === scenario.id && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">선택됨</span>
                            )}
                            {activeScenarioId === scenario.id && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">적용됨</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            전체 인상률: {(scenario.data.weightedAverageRate ?? (scenario.data.baseUpRate + scenario.data.meritRate)).toFixed(1)}%
                            {scenario.data.usedBudget ? (
                              <span className="ml-2">
                                | 사용 예산: {(scenario.data.usedBudget / 100000000).toFixed(0)}억원
                              </span>
                            ) : scenario.data.totalBudget ? (
                              <span className="ml-2">
                                | 총 예산: {(scenario.data.totalBudget / 100000000).toFixed(0)}억원
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(scenario.updatedAt).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // 기본 시나리오는 삭제 불가
                            if (scenario.id === 'default') {
                              alert('Default 시나리오는 삭제할 수 없습니다.')
                              return
                            }
                            if (confirm(`"${scenario.name}" 시나리오를 삭제하시겠습니까?`)) {
                              onDelete(scenario.id)
                            }
                          }}
                          className={`p-1 ml-2 ${
                            scenario.id === 'default' 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-400 hover:text-red-600'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}